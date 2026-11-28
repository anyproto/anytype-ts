/**
 * Claude Desktop (targetId `claude-desktop`). Anytype keeps no copy of the key (tokens-plan §3): it lives only
 * where Claude keeps it.
 *
 * Extension (`method: 'package'`, macOS and Windows): one static `.mcpb` (the signed forwarder inside, no key)
 * whose manifest asks for the key in a required, sensitive `user_config` field and starts `serve --tier full`
 * (always Full). Apply checks everything first (the bundle, the two-server guard, the preflight); the service
 * then saves the record `waiting` (the commit), copies the key to the clipboard and only then runs `deliver`:
 * the bundle copy is opened in Claude, or nothing when the installed extension is ours and the key goes in
 * through Claude's Configure (`configure`). A check reports Claude's install identity; the service decides
 * "Connected" from heart's `isActive` (the confirmation latch).
 *
 * Config route (`method: 'config'`; the only route on Linux, needs forwarder.stdioSupported): Claude must be
 * closed (consent before any key exists), the stable copy is installed (`~/.anytype/bin`), the preflight runs
 * on it, and the entry `anytype-mcp serve --tier <t>` with the key in `env` is merged into
 * claude_desktop_config.json under `claude-desktop.lock`, after the candidate (entry digest and key
 * fingerprint) was saved; Claude is relaunched on every path after Anytype quit it. The entry is ours exactly
 * when its digest is the record's; any other entry is Needs attention ▸ Reconnect. A tier change is a Reconnect.
 * - Running state unknown (Linux: no verified executable; Windows MSIX; a failed process query): the user
 *   quits Claude and confirms (`quitConfirmed`). Before every config write the state is read again: a
 *   running Claude (a new instance, or several processes, included) is never written behind.
 * - The entry's presence comes from the snapshot taken BEFORE Claude was quit: one that vanished while Claude
 *   quit is the user's removal, never re-added.
 *
 * One connection, one server (`claudeRoutes`): the settings-file route is refused while the extension is there
 * (Anytype can't remove an extension), before a key is minted; a check that finds both says `conflict`. The
 * extension replaces an Anytype entry in Claude's settings file only after the user's Replace for exactly that
 * entry (`ctx.replace`, its digest), Claude closed first: the plan asks before any key exists, apply checks the
 * consent again under the lock, and the service removes the entry (`removeEntry`) right after the record's save,
 * before the key is copied; when that fails the save is undone. A settings file that can't be read is refused as
 * before. Anytype removes nothing without that Replace.
 *
 * Extension state files (UNVERIFIED field names): `extensions-installations.json` → the record of the extension
 * id (version, installedAt, signatureInfo), and `Claude Extensions Settings/<id>.json` → `isEnabled` (the only
 * field read; the parsed object is never kept).
 */
import type { Adapter, AiError, AiPlan, AiRecord, AiStep, AiTier, ApplyOutcome, CheckOutcome, Ctx, Detected, Env } from '../types';
import { dirsWritable, isLocalAbsolute, pathOf, readSnapshot, resolveTarget, writeFileSafe } from '../fsSafe';
import { canonicalDigest, keyFingerprint } from '../digest';
import { claudeDesktopDir, powershellPath } from '../detect';
import { bundleDir, bundleInfo, bundleUsable, copyBundle, ensureStoreDir, loadBundle, type BundleInfo } from '../bundle';
import { KEY_VAR, buildMeta, ensureInstalled, serveCommand, stdioSupported, usable, withLock } from '../forwarder';
import { preflight } from '../endpoint';
import { UTF8_OUTPUT, launch, quit, runningState } from '../restart';
import { basePlan, displayPath, err, goneError, manualPlan, mayWrite, mergeStep, placeholder, protectedError, protectedTarget } from './common';
import { jsonFormat } from './jsonEntry';

export const TARGET_ID = 'claude-desktop';
/** `local.mcpb.<author>.<name>` from the manifest (author "Anytype", name "anytype"); never changes (§5) */
export const EXTENSION_ID = 'local.mcpb.anytype.anytype';
/** A build whose metadata says `signed: false` names its bundle `anytype-dev`: a separate extension */
export const EXTENSION_ID_DEV = 'local.mcpb.anytype.anytype-dev';

export const extensionId = (env: Env): string => buildMeta(env)?.signed ? EXTENSION_ID : EXTENSION_ID_DEV;
export const INSTALLATIONS_FILE = 'extensions-installations.json';
/**
 * The value of `signatureInfo.status` Claude writes for a bundle whose signature it verified. UNVERIFIED: read off
 * a signed install on the alpha (§5 D2); while it is null a signed build always opens the bundle, never Configure
 */
export const CLAUDE_SIGNED_STATUS: string | null = null;
export const SETTINGS_DIR = 'Claude Extensions Settings';

export type ExtensionState = 'installed' | 'disabled' | 'outdated' | 'absent' | 'unreadable';

export interface ExtensionInfo {
	state: ExtensionState;
	/** The installation record's `version` and `installedAt`: Claude's install identity, which the confirmation latch is bound to */
	version: string;
	installedAt: string;
	/** Verified, and (signed build) Claude reports the extension's signature as valid: the key may go in through Configure */
	configurable: boolean;
	/** Is an extension there: none installed, an installation record, or unknown (the file can't be read) */
	present: 'none' | 'record' | 'unknown';
	/** The installation record is Anytype's: expected id, version ≥ the bundle's, and (signed build) the expected signer */
	verified: boolean;
	/** An installation record exists and isn't switched off, whatever its version or signer (Q14) */
	enabled: boolean;
};

const INSTRUCTIONS = { confirmInApp: 'aiConnectStepConfirm', stalled: 'aiConnectHintClaudeDesktop', restart: 'aiConnectStepRestart', toggle: 'aiConnectStepEnableExtension' };

const CONFIG = jsonFormat([ 'mcpServers', 'anytype' ]);

/**
 * The Claude MSIX packages Anytype launches, by exact identity: package family name (its suffix is the
 * publisher's id) and publisher. UNVERIFIED on a Windows machine: an unknown identity gets Reveal instead.
 */
export const CLAUDE_PACKAGES: { family: string; publisher: string }[] = [
	{ family: 'Claude_pzs8sxrjxfjjc', publisher: 'CN=Anthropic, PBC, O=Anthropic, PBC, L=San Francisco, S=California, C=US' },
];

/** One constant query: the known packages' identity fields, compared in TypeScript */
export const CLAUDE_PACKAGE_QUERY = `${UTF8_OUTPUT} Get-AppxPackage | Where-Object { @(${CLAUDE_PACKAGES.map(p => `'${p.family}'`).join(',')}) -contains $_.PackageFamilyName } | Select-Object PackageFamilyName, Publisher, InstallLocation | ConvertTo-Json -Compress`;

/** A JSON file of Claude's: missing, unreadable (there but not readable or parseable), or its value. One leading BOM is fine */
const readClaudeJson = (env: Env, p: string): { kind: 'missing' } | { kind: 'unreadable' } | { kind: 'ok'; value: any } => {
	const res = env.readFile(p, 4 * 1024 * 1024);

	if (!('data' in res)) {
		return (res.error == 'missing') ? { kind: 'missing' } : { kind: 'unreadable' };
	};
	try {
		return { kind: 'ok', value: JSON.parse(res.data.toString('utf8').replace(/^\uFEFF/, '')) };
	} catch (e) {
		return { kind: 'unreadable' };
	};
};

const present = (v: any): boolean => (v !== undefined) && (v !== null);

/** Dotted numeric versions; missing parts are 0 */
export const compareVersions = (a: string, b: string): number => {
	const pa = String(a || '').split('.').map(n => parseInt(n, 10) || 0);
	const pb = String(b || '').split('.').map(n => parseInt(n, 10) || 0);

	for (let i = 0; i < Math.max(pa.length, pb.length, 3); i++) {
		if ((pa[i] || 0) != (pb[i] || 0)) {
			return (pa[i] || 0) - (pb[i] || 0);
		};
	};
	return 0;
};

/** The installation record of our extension: a map keyed by id, an array of records, or a top-level key */
const installationRecord = (data: any, id: string): any => {
	const list = data?.extensions ?? data;

	if (Array.isArray(list)) {
		return list.find(it => it?.id == id) || null;
	};
	return (list && (typeof list == 'object') && Object.prototype.hasOwnProperty.call(list, id)) ? list[id] : null;
};

/** The signer's SHA-256 fingerprint as lower-case hex without separators, or '' */
const signerOf = (record: any): string => {
	const info = record?.signatureInfo || {};
	const raw = info.fingerprint || info.certificateFingerprint || info.signer?.fingerprint || '';

	return String(raw).toLowerCase().replace(/[^0-9a-f]/g, '');
};

/**
 * The extension's current state (table in the plan, §3.8) and whether it is known to be one Anytype must
 * not hand a key to. Version and signer come first: a known mismatch is `outdated` even when the settings
 * file is missing or broken.
 */
export const extensionInfo = (env: Env, bundle: BundleInfo | null): ExtensionInfo => {
	const P = pathOf(env);
	const dir = claudeDesktopDir(env);
	const installations = readClaudeJson(env, P.join(dir, INSTALLATIONS_FILE));

	const none = { version: '', installedAt: '', configurable: false };

	if (installations.kind != 'ok') {
		return { state: 'unreadable', present: (installations.kind == 'missing') ? 'none' : 'unknown', verified: false, enabled: false, ...none };
	};

	const id = extensionId(env);
	const record = installationRecord(installations.value, id);

	if (!record) {
		return { state: 'absent', present: 'none', verified: false, enabled: false, ...none };
	};

	// Read for every record, also an outdated one: Claude runs whatever is installed and switched on
	const settings = readClaudeJson(env, P.join(dir, SETTINGS_DIR, `${id}.json`));
	const enabled = (settings.kind == 'ok') ? settings.value?.isEnabled : undefined;
	const on = (enabled !== false);
	const version = String(record.version || record.manifest?.version || '');
	const installedAt = String(record.installedAt ?? record.installed_at ?? '');
	const versionOk = bundleUsable(bundle) && !!version && (compareVersions(version, bundle.version) >= 0);
	const signerOk = bundleUsable(bundle) && (!bundle.signed || (signerOf(record) === bundle.signerFingerprint));
	// A signed build also needs Claude's own verdict on the signature, whose literal isn't known yet: until then never
	const statusOk = !bundle?.signed || ((CLAUDE_SIGNED_STATUS !== null) && (record?.signatureInfo?.status === CLAUDE_SIGNED_STATUS));
	const identity = { version, installedAt };

	if (!versionOk || !signerOk) {
		return { state: 'outdated', present: 'record', verified: false, enabled: on, configurable: false, ...identity };
	};

	if (typeof enabled != 'boolean') {
		return { state: 'unreadable', present: 'record', verified: true, enabled: on, configurable: statusOk, ...identity };
	};
	return { state: enabled ? 'installed' : 'disabled', present: 'record', verified: true, enabled: on, configurable: statusOk, ...identity };
};

export const extensionState = (env: Env, bundle: BundleInfo | null): ExtensionState => extensionInfo(env, bundle).state;

export const configFile = (env: Env): string => pathOf(env).join(claudeDesktopDir(env), 'claude_desktop_config.json');

/** The entry Anytype writes into Claude's config: the stable copy, the tier, the key in `env` */
const entryOf = (env: Env, tier: AiTier, key: string) => serveCommand(env, { tier, key });

/**
 * Windows: the Claude.exe of the installation detection found, never another package. The classic
 * install: its detected exe. An MSIX package: only one of CLAUDE_PACKAGES, by exact family name (equal to
 * the detected package folder) AND exact publisher, read with one constant query. Anything else → null
 * (the user gets Reveal instead).
 */
export const windowsClaudeExe = async (env: Env, det: Detected): Promise<string | null> => {
	const P = pathOf(env);

	if (det.exePath) {
		return env.stat(det.exePath)?.isFile ? det.exePath : null;
	};

	const family = det.appPath ? P.basename(det.appPath) : '';
	const known = CLAUDE_PACKAGES.find(p => p.family === family);

	if (!known) {
		return null;
	};

	const res = await env.run(powershellPath(env), [ '-NoProfile', '-NonInteractive', '-Command', CLAUDE_PACKAGE_QUERY ], { timeout: 5000 });
	let rows: any[] = [];

	try {
		const data = ((res.code == 0) && !res.stdout.includes('\uFFFD')) ? JSON.parse(res.stdout.replace(/^\uFEFF/, '')) : null;

		rows = Array.isArray(data) ? data : (data ? [ data ] : []);
	} catch (e) { /* no such package */ };

	const row = rows.find(r => (r?.PackageFamilyName === known.family) && (r?.Publisher === known.publisher));
	const location = (typeof row?.InstallLocation == 'string') ? row.InstallLocation : '';

	if (!isLocalAbsolute(env, location)) {
		return null;
	};

	const exe = P.join(location, 'app', 'Claude.exe');
	return env.stat(exe)?.isFile ? exe : null;
};

/** Opens the bundle in Claude: macOS `open -a <app> <file>`, Windows `Claude.exe <file>`; false when it can't */
const openBundle = async (env: Env, det: Detected, file: string): Promise<boolean> => {
	if (env.platform == 'darwin') {
		if (!det.appPath) {
			return false;
		};
		return (await env.run('/usr/bin/open', [ '-a', det.appPath, file ], { timeout: 10000 })).code == 0;
	};
	if (env.platform == 'win32') {
		const exe = await windowsClaudeExe(env, det);
		return exe ? env.launch(exe, [ file ]) : false;
	};
	return false;
};

/** The manual steps of the config route: the entry with the key placeholder, kept private, then a restart */
const configSteps = (env: Env, tier: AiTier): AiStep[] => [
	mergeStep({ mcpServers: { anytype: entryOf(env, tier, placeholder) } }, configFile(env)),
	{ textKey: 'aiConnectManualKeepPrivate' },
	{ textKey: 'aiConnectStepRestartSelf', args: [ 'Claude' ] },
];

const useConfigRoute = (ctx: Ctx): boolean => (ctx.method == 'config') || (ctx.env.platform == 'linux');

/**
 * Both of Claude's routes, as they are now (§3.2 "one guard for both routes"): `config` — claude_desktop_config.json
 * has `mcpServers.anytype`; `extension` — an Anytype extension (either flavour) is installed and not switched off.
 * A file that exists but can't be read counts as present
 */
export const claudeRoutes = (env: Env): { config: boolean; extension: boolean } => {
	const t = loadConfig(env);
	const config = ('error' in t) || present(t.value);
	const installations = readClaudeJson(env, pathOf(env).join(claudeDesktopDir(env), INSTALLATIONS_FILE));
	let extension = (installations.kind == 'unreadable');

	if (installations.kind == 'ok') {
		for (const id of [ EXTENSION_ID, EXTENSION_ID_DEV ]) {
			if (installationRecord(installations.value, id)) {
				const settings = readClaudeJson(env, pathOf(env).join(claudeDesktopDir(env), SETTINGS_DIR, `${id}.json`));

				extension = extension || (settings.kind != 'ok') || (settings.value?.isEnabled !== false);
			};
		};
	};
	return { config, extension };
};

/** The two-server refusal of a plan: which of the two is in the way */
const bothRoutesPlan = (plan: AiPlan, other: 'config' | 'extension'): AiPlan => ({
	...manualPlan(plan, err('validate', 'conflict'), []),
	note: (other == 'config') ? 'aiConnectClaudeBothConfig' : 'aiConnectClaudeBothExtension',
});

/**
 * No bundle Claude could install: none in this build (a development build without a forwarder) or one that fails
 * its digest check. Never `unsupportedPackage` (that is the Linux sandbox only); a development build's text says
 * how to put the forwarder in place
 */
export const bundleMissing = (env: Env): AiError => ({ ...err('verify', 'bundleMissing'), ...(buildMeta(env)?.signed ? {} : { devBuild: true }) });

/**
 * S8: Claude's config file is shared by every account and every Anytype profile, so deciding whose the entry is
 * and changing it run one at a time across processes: an exclusive `~/.anytype/ai-connect/claude-desktop.lock`
 * (the stable copy's lock rules). null: not acquired, and nothing was done.
 */
const LOCK_NAME = 'claude-desktop.lock';
const configLock = async <T>(env: Env, fn: () => Promise<T>): Promise<T | null> => ((await ensureStoreDir(env)) ? withLock(env, bundleDir(env), fn, LOCK_NAME) : null);

// ---------------------- the extension ---------------------- //

/**
 * Whether Claude may be written behind for removing the entry, before any key exists (plan) or before the commit
 * (apply): Claude rewrites its settings file while it runs, so it is closed first, as on the config route. null:
 * it may (stopped, or unknown after the user said they quit it, or running and Anytype may quit it)
 */
const quitNeeded = async (ctx: Ctx, det: Detected): Promise<'quitApp' | 'quitAppSelf' | null> => {
	const running = await runningState(ctx.env, det);

	if (running.state == 'unknown') {
		return ctx.quitConfirmed ? null : 'quitAppSelf';
	};
	if (running.state == 'running') {
		// Several main processes: none can be picked to signal, the user quits Claude
		if (!running.pid) {
			return 'quitAppSelf';
		};
		return ctx.allowQuit ? null : 'quitApp';
	};
	return null;
};

const primary = {
	plan: async (ctx: Ctx, det: Detected, rec: AiRecord | null, base: AiPlan): Promise<AiPlan> => {
		const bundle = bundleInfo(ctx.env);
		// Always Full (§3.3): the bundle's manifest starts `serve --tier full`
		const plan: AiPlan = { ...base, tier: 'full', method: 'package', nextStep: 'confirmInApp', sentenceKey: 'aiConnectPlanPackage', steps: [], bundleSigned: !!bundle?.signed };

		if (!bundleUsable(bundle)) {
			// No bundle to install (damaged, or a build without one): Claude's settings file by hand, where it can run
			const steps = usable(ctx.env).ok ? configSteps(ctx.env, ctx.tier) : [];

			if (claudeRoutes(ctx.env).extension) {
				return bothRoutesPlan(plan, 'extension');
			};
			return { ...manualPlan({ ...plan, tier: ctx.tier }, bundleMissing(ctx.env), steps), needsKey: !!steps.length };
		};

		// Claude's settings file: one that can't be read (or isn't Anytype's to write) is refused as before; an
		// Anytype entry in it is replaced, only after the user's Replace (bound to its digest; its contents, which can
		// hold a key, are never shown)
		const t = loadConfig(ctx.env);

		if ('error' in t) {
			return bothRoutesPlan(plan, 'config');
		};

		const own = usable(ctx.env);

		if (!('path' in own)) {
			return manualPlan(plan, own.error, []);
		};

		const denied = await preflight(ctx, own.path);

		if (denied) {
			return manualPlan(plan, denied, []);
		};
		if (present(t.value)) {
			plan.existing = entryOurs(t.value, rec) ? 'ours' : 'foreign';
			plan.replace = { targetPath: t.real, foreignDigest: canonicalDigest(t.value) };
			plan.note = 'aiConnectClaudeReplaceConfig';

			// Asked before any key exists: Anytype quits Claude (one process), or the user does
			const needs = await quitNeeded({ ...ctx, allowQuit: false, quitConfirmed: false }, det);

			if (needs) {
				plan.preflight = needs;
			};
		};
		if (extensionInfo(ctx.env, bundle).configurable) {
			return { ...plan, configure: true, sentenceKey: 'aiConnectPlanPackageConfigure' };
		};
		return plan;
	},

	apply: async (ctx: Ctx, det: Detected, rec: AiRecord | null): Promise<ApplyOutcome> => {
		// Main forces Full on this route and refuses anything else (D1-18)
		if (ctx.tier != 'full') {
			return { ok: false, error: err('validate', 'unknown') };
		};

		const loaded = loadBundle(ctx.env);
		const bundle = loaded?.info || null;

		if (!loaded || !bundleUsable(bundle)) {
			return { ok: false, error: bundleMissing(ctx.env) };
		};

		const pre = loadConfig(ctx.env);

		if ('error' in pre) {
			return { ok: false, error: err('validate', 'conflict') };
		};
		// An Anytype entry in Claude's settings file only with the user's Replace for exactly this entry
		if (present(pre.value) && !entryConsent(ctx, pre)) {
			return { ok: false, error: err('validate', 'conflict', pre.real) };
		};

		const own = usable(ctx.env);

		if (!('path' in own)) {
			return { ok: false, error: own.error };
		};

		const denied = await preflight(ctx, own.path);

		if (denied) {
			return { ok: false, error: denied };
		};

		let replacing = present(pre.value);

		if (replacing) {
			const needs = await quitNeeded(ctx, det);

			if (needs) {
				return { ok: false, needs };
			};

			// The consent against the file as it is now, under Claude's config lock (every profile's writer and removal wait for it)
			const now = await configLock(ctx.env, async (): Promise<AiError | 'gone' | 'agreed'> => {
				const t = loadConfig(ctx.env);

				if ('error' in t) {
					return err('validate', 'conflict');
				};
				if (!present(t.value)) {
					return 'gone';
				};
				return entryConsent(ctx, t) ? 'agreed' : err('validate', 'conflict', t.real);
			});

			// Not acquired (another profile is at it): nothing was done
			if (!now) {
				return { ok: false, error: err('write', 'changed') };
			};
			if ((now != 'gone') && (now != 'agreed')) {
				return { ok: false, error: now };
			};
			// Removed meanwhile (the user's own edit): nothing left to replace
			replacing = (now == 'agreed');
		};

		const info = extensionInfo(ctx.env, bundle);
		const configure = info.configurable;
		const install = info.version ? { version: info.version, installedAt: info.installedAt } : null;
		/** Anytype quit Claude to remove the entry: it is started again on every path that doesn't open the bundle */
		let quitted = false;
		const relaunch = async (): Promise<boolean> => !quitted || !('error' in (await launch(ctx.env, det)));

		/**
		 * After the commit, before the key is copied: the entry the user agreed to replace goes. Claude is quit first
		 * when it runs (and Anytype may); under the lock the entry must still be exactly that one (gone already is
		 * fine), and only `mcpServers.anytype` is removed, by the config route's writer (a secret write: no backup,
		 * no temp left behind, every other byte of the file as it was). A refusal starts Claude again if Anytype quit it
		 */
		const removeEntry = async (): Promise<null | { needs: 'quitApp' | 'quitAppSelf' } | { error: AiError }> => {
			const needs = await quitNeeded(ctx, det);

			if (needs) {
				return { needs };
			};

			if ((await runningState(ctx.env, det)).state == 'running') {
				const res = await quit(ctx.env, det, ctx.signalled || new Set());

				if ('error' in res) {
					// Another instance started meanwhile: left alone, the user is asked again
					return (res.error.category == 'changed') ? { needs: 'quitApp' } : { error: res.error };
				};
				quitted = true;
			};

			const mayEdit = async (): Promise<boolean> => {
				const now = await runningState(ctx.env, det);
				return (now.state == 'stopped') || ((now.state == 'unknown') && !!ctx.quitConfirmed);
			};
			const locked = await configLock(ctx.env, () => writeConfigEntry(ctx.env, undefined, async t => {
				if (!(await mayEdit())) {
					return STILL_RUNNING;
				};
				if (!present(t.value)) {
					return 'skip';
				};
				return entryConsent(ctx, t) ? null : err('validate', 'conflict', t.real);
			}));
			const res = locked || { ok: false as const, error: err('write', 'changed') };

			if ('error' in res) {
				const back = await relaunch();

				quitted = false;
				if (res.error.stage == 'restart') {
					return { needs: 'quitApp' };
				};
				return { error: back ? res.error : { ...res.error, openFailed: true } };
			};
			return null;
		};

		// Run by the service once the record is saved (and the entry removed) and the key copied: no key is in the bundle or its copy
		const deliver = async (): Promise<boolean> => {
			if (configure) {
				// Nothing is opened: a Claude that Anytype quit is started again for its Configure
				await relaunch();
				return true;
			};

			const copy = await copyBundle(ctx.env, loaded.data);
			const opened = ('path' in copy) && (await openBundle(ctx.env, det, copy.path));

			// Opening the bundle starts Claude; one that wasn't opened is started again after Anytype quit it
			if (!opened) {
				await relaunch();
			};
			return opened;
		};

		return {
			ok: true, method: 'package', nextStep: 'confirmInApp', targetPath: '', observedInstalled: false, createdDirs: [], deliver, configure, install,
			...(replacing ? { removeEntry } : {}),
		};
	},
};

/** "Open again" (no key involved): the bundle copy is written and opened in Claude */
export const openBundleAgain = async (env: Env, det: Detected): Promise<boolean> => {
	const loaded = loadBundle(env);

	// Never a second server: not while Claude's settings file has an Anytype entry
	if (!loaded || !bundleUsable(loaded.info) || claudeRoutes(env).config) {
		return false;
	};

	const copy = await copyBundle(env, loaded.data);
	return ('path' in copy) && openBundle(env, det, copy.path);
};

// ---------------------- config route: the entry with the key ---------------------- //

interface ConfigTarget {
	real: string;
	snapshot: any;
	text: string | null;
	value: any;
};

/** The config file: `file` (a record's own, recorded at install) or the one Claude's profile resolves to now */
const loadConfig = (env: Env, file?: string): ConfigTarget | { error: AiError } => {
	const target = resolveTarget(env, file || configFile(env));

	if ('error' in target) {
		return target;
	};
	if (protectedTarget(env, target.real)) {
		return { error: protectedError(target.real) };
	};

	const snapshot = readSnapshot(env, target.real);

	if ('error' in snapshot) {
		return snapshot;
	};

	const parsed = CONFIG.read(snapshot.text);

	if (!parsed) {
		return { error: err('parse', 'unparseable', target.real) };
	};
	return { real: target.real, snapshot, text: snapshot.text, value: parsed.value };
};

/** The entry this record wrote (its digest, key included); decides check and remove */
const entryOurs = (value: any, rec: AiRecord | null): boolean => present(value) && !!rec?.entryDigest && (canonicalDigest(value) == rec.entryDigest);

/** A replace consent that names exactly this config entry */
const entryConsent = (ctx: Ctx, t: ConfigTarget): boolean => present(t.value) && !!ctx.replace && (ctx.replace.targetPath == t.real) && (ctx.replace.foreignDigest == canonicalDigest(t.value));

/**
 * Sets (or removes, with undefined) `mcpServers.anytype`; one retry on `changed`. `expect` runs before every
 * attempt: null → write; an error → refused; 'skip' → nothing to do. Always a secret write: the file holds a
 * key (ours, or another one), so no backup and no temp of it is left behind
 */
const writeConfigEntry = async (env: Env, value: any, expect: (current: ConfigTarget, attempt: number) => Promise<AiError | 'skip' | null>, file?: string): Promise<{ ok: true; real: string; createdDirs: string[] } | { ok: false; error: AiError }> => {
	for (let attempt = 0; attempt < 2; attempt++) {
		const t = loadConfig(env, file);

		if ('error' in t) {
			return { ok: false, error: t.error };
		};

		const verdict = await expect(t, attempt);

		if (verdict == 'skip') {
			return { ok: true, real: t.real, createdDirs: [] };
		};
		if (verdict) {
			return { ok: false, error: verdict };
		};

		const edit = present(value) ? CONFIG.set(t.text, value) : CONFIG.remove(t.text);

		if (!('text' in edit)) {
			return { ok: false, error: err('parse', edit.category, t.real) };
		};

		const res = await writeFileSafe(env, t.real, edit.text, { snapshot: t.snapshot, secret: true });

		if ('createdDirs' in res) {
			return { ok: true, real: t.real, createdDirs: res.createdDirs };
		};
		if ('error' in res) {
			return { ok: false, error: res.error };
		};
	};
	return { ok: false, error: err('write', 'changed') };
};

/** Claude is running (again) while Anytype was about to write its config: the writer stops, the user is asked */
const STILL_RUNNING = err('restart', 'changed');

const fallback = {
	plan: async (ctx: Ctx, det: Detected, rec: AiRecord | null, base: AiPlan): Promise<AiPlan> => {
		const plan: AiPlan = { ...base, method: 'config', nextStep: 'restart', sentenceKey: 'aiConnectPlanConfigRestart', steps: configSteps(ctx.env, ctx.tier), needsKey: true };

		// Stated before any key exists: this package can't be started by Claude
		if (!stdioSupported(ctx.env)) {
			return { ...plan, canApply: false, method: 'manual', error: err('detect', 'unsupportedPackage'), note: 'aiConnectLinuxPackageLimit', steps: [], needsKey: false };
		};

		// The forwarder this build ships must be there and match its metadata, or no entry could start
		const own0 = usable(ctx.env);

		if (!('path' in own0)) {
			return { ...manualPlan(plan, own0.error, []), needsKey: false };
		};
		// One connection, one server: with the extension there as well, Claude would run two
		if (claudeRoutes(ctx.env).extension) {
			return { ...bothRoutesPlan(plan, 'extension'), needsKey: false };
		};

		// The entry names the stable copy: installed now, and the preflight runs on exactly that file
		const installed = await ensureInstalled(ctx.env);

		if (!('path' in installed)) {
			return { ...manualPlan(plan, installed.error, []), needsKey: false };
		};

		const denied = await preflight(ctx, installed.path);

		if (denied) {
			return { ...manualPlan(plan, denied, []), needsKey: false };
		};

		const t = loadConfig(ctx.env);

		if ('error' in t) {
			return { ...manualPlan(plan, t.error, plan.steps), needsKey: true };
		};

		// The writer's own edit and directory rules on the previewed file
		const dry = CONFIG.set(t.text, entryOf(ctx.env, ctx.tier, placeholder));

		if (!('text' in dry)) {
			return { ...manualPlan(plan, err('parse', dry.category, t.real), plan.steps), needsKey: true };
		};

		const dirs = dirsWritable(ctx.env, t.real);

		if (dirs) {
			return { ...manualPlan(plan, dirs, plan.steps), needsKey: true };
		};

		plan.displayTarget = displayPath(ctx.env, t.real);
		plan.targetPath = t.real;

		if (present(t.value)) {
			plan.existing = entryOurs(t.value, rec) ? 'ours' : 'foreign';
			if (plan.existing == 'foreign') {
				plan.replace = { targetPath: t.real, foreignDigest: canonicalDigest(t.value) };
			};
		};

		const running = await runningState(ctx.env, det);

		if (running.state == 'running') {
			// Several main processes: none can be picked to signal, the user quits Claude
			plan.preflight = ((ctx.env.platform == 'linux') || !running.pid) ? 'quitAppSelf' : 'quitApp';
		} else
		if (running.state == 'unknown') {
			plan.preflight = 'quitAppSelf';
		};
		return plan;
	},

	apply: async (ctx: Ctx, det: Detected, rec: AiRecord | null): Promise<ApplyOutcome> => {
		if (!stdioSupported(ctx.env)) {
			return { ok: false, error: err('detect', 'unsupportedPackage') };
		};
		if (claudeRoutes(ctx.env).extension) {
			return { ok: false, error: err('validate', 'conflict') };
		};

		const entry = entryOf(ctx.env, ctx.tier, ctx.key);
		const digest = canonicalDigest(entry);
		const needs = (ctx.env.platform == 'linux') ? 'quitAppSelf' : 'quitApp';

		// Everything that can refuse is checked before Claude is touched: the edit, the forwarder, the preflight, the owner
		const baseline = async (): Promise<{ pre: ConfigTarget } | { ok: false; error: AiError }> => {
			const pre = loadConfig(ctx.env);

			if ('error' in pre) {
				return { ok: false, error: pre.error };
			};

			const dry = CONFIG.set(pre.text, entry);

			if (!('text' in dry)) {
				return { ok: false, error: err('parse', dry.category, pre.real) };
			};

			const dirs = dirsWritable(ctx.env, pre.real);

			if (dirs) {
				return { ok: false, error: dirs };
			};

			// The entry must be able to start: the stable copy, installed or updated now, and found safe by the forwarder
			const installed = await ensureInstalled(ctx.env);

			if (!('path' in installed)) {
				return { ok: false, error: installed.error };
			};

			const denied = await preflight(ctx, installed.path);

			if (denied) {
				return { ok: false, error: denied };
			};
			if (present(pre.value) && !entryOurs(pre.value, rec) && !entryConsent(ctx, pre)) {
				return { ok: false, error: err('validate', 'conflict', pre.real) };
			};
			return { pre };
		};
		const first = await baseline();

		if (!('pre' in first)) {
			return first;
		};

		// What was there before Claude was quit decides whether the entry may be created
		let entryWasPresent = present(first.pre.value);
		const running = await runningState(ctx.env, det);
		let quitted = false;

		if (running.state == 'unknown') {
			// No way to tell: only after the user said they quit Claude
			if (!ctx.quitConfirmed) {
				return { ok: false, needs: 'quitAppSelf' };
			};
		} else
		if (running.state == 'running') {
			// A running Claude is never written behind, whatever the user said; several processes: the user quits it
			if (!running.pid) {
				return { ok: false, needs: 'quitAppSelf' };
			};
			if (!ctx.allowQuit || (ctx.env.platform == 'linux')) {
				return { ok: false, needs };
			};

			const res = await quit(ctx.env, det, ctx.signalled || new Set());

			if ('error' in res) {
				// Another instance started meanwhile: left alone, the user is asked again
				return (res.error.category == 'changed') ? { ok: false, needs: 'quitApp' } : { ok: false, error: res.error };
			};
			quitted = true;
		};

		/** Every path after Anytype quit Claude relaunches it; a failed relaunch is reported on every outcome */
		const finish = async (outcome: ApplyOutcome): Promise<ApplyOutcome> => {
			const relaunched = !quitted || !('error' in (await launch(ctx.env, det)));

			if (relaunched) {
				return outcome;
			};
			if ('method' in outcome) {
				return { ...outcome, nextStep: 'restart', openFailed: true };
			};
			return ('error' in outcome) ? { ok: false, error: { ...outcome.error, openFailed: true } } : outcome;
		};

		/** Claude may be written behind: stopped, or unknown after the user confirmed they quit it */
		const mayEdit = async (): Promise<boolean> => {
			const now = await runningState(ctx.env, det);
			return (now.state == 'stopped') || ((now.state == 'unknown') && !!ctx.quitConfirmed);
		};

		// S8: one at a time with every other profile's apply and removal. Waiting for Claude to quit happened above, outside the lock
		const locked = await configLock(ctx.env, async (): Promise<ApplyOutcome> => {
			// Nothing was done to Claude: what is there now, under the lock, is the state to judge by. After a quit the earlier reading stands
			if (!quitted) {
				const again = await baseline();

				if (!('pre' in again)) {
					return again;
				};
				entryWasPresent = present(again.pre.value);
			};

			const nextStep = quitted ? 'none' : 'restart';
			const real = first.pre.real;

			// The candidate (digest and fingerprint) is saved before the key goes into the file: a crash after the
			// write is settled by the next check, which reads the entry's key
			if (ctx.journal && !ctx.journal.set({ method: 'config', route: ctx.route, targetPath: real, nextStep, entryDigest: digest, configPath: real })) {
				return { ok: false, error: err('write', 'unsaved') };
			};

			const merged = await writeConfigEntry(ctx.env, entry, async t => {
				if (!(await mayEdit())) {
					return STILL_RUNNING;
				};

				const here = present(t.value);
				const verdict = mayWrite({
					mode: 'install', present: here, owned: here && entryOurs(t.value, rec), consent: entryConsent(ctx, t),
					consentHere: ctx.replace?.targetPath == t.real, wasPresent: entryWasPresent,
				});

				if (verdict == 'conflict') {
					return err('validate', 'conflict', t.real);
				};
				return (verdict == 'gone') ? goneError('install', t.real) : null;
			}, real);

			if ('error' in merged) {
				return (merged.error.stage == 'restart') ? { ok: false, needs } : { ok: false, error: merged.error };
			};
			return { ok: true, method: 'config', nextStep, targetPath: merged.real, observedInstalled: true, createdDirs: merged.createdDirs, entryDigest: digest, configPath: merged.real };
		});

		// The lock could not be taken (another profile is at it): nothing was written
		return finish(locked || { ok: false, error: err('write', 'changed') });
	},
};

/** The config file a record's entry was written to (recorded at install); '' when it has none */
const recordConfig = (rec: AiRecord): string => rec.configPath || (((rec.method == 'config') && rec.entryDigest) ? rec.targetPath : '');

/**
 * Disconnect of the config route, under the lock (§3.2 revocation order): read the entry; not ours → `conflict`
 * and nothing queued; ours (or gone) → the hashes are saved in revokePending (`ctx.queue`) → the entry is deleted
 */
const removeConfig = async (ctx: Ctx, rec: AiRecord): Promise<Awaited<ReturnType<Adapter['remove']>>> => {
	const cfg = recordConfig(rec);
	const t = loadConfig(ctx.env, cfg || undefined);
	const queued = (): boolean => !ctx.queue || ctx.queue();

	if (('error' in t) || !present(t.value)) {
		// Gone already, or it can't be read now (the key is revoked anyway; the entry may still be there)
		if (!queued()) {
			return { ok: false, error: err('write', 'unsaved') };
		};
		return { ok: true, ...((('error' in t) && (t.error.category != 'notFound')) ? { left: 'entry' as const } : {}) };
	};
	if (!entryOurs(t.value, rec)) {
		return { ok: false, error: err('validate', 'conflict', t.real) };
	};
	if (!queued()) {
		return { ok: false, error: err('write', 'unsaved') };
	};

	const det = ctx.detections.find(d => d.appId == 'claude-desktop');
	const running = det ? await runningState(ctx.env, det) : { state: 'unknown' as const };

	if (running.state != 'stopped') {
		// Never written behind a running Claude: the entry stays (its key is revoked)
		return { ok: true, left: 'entry' };
	};

	const res = await writeConfigEntry(ctx.env, undefined, async cur => entryOurs(cur.value, rec) ? null : err('validate', 'conflict', cur.real), t.real);
	return { ok: true, ...(('error' in res) ? { left: 'entry' as const } : {}) };
};

/** The key the record's (or a candidate's) config entry carries now */
const entryKeyFp = (env: Env, file: string): string | null | 'unreadable' => {
	const t = loadConfig(env, file || undefined);

	if ('error' in t) {
		return (t.error.category == 'notFound') ? null : 'unreadable';
	};

	const key = t.value?.env?.[KEY_VAR];
	return ((typeof key == 'string') && key) ? keyFingerprint(key) : null;
};

// ---------------------- the adapter ---------------------- //

export const claudeDesktop: Adapter = {
	ids: [ 'claude-desktop' ],
	target: (env, det) => (det.targetId && det.targetPaths[0]) ? { targetId: det.targetId, path: det.targetPaths[0] } : null,

	plan: async (ctx, det, rec) => {
		const base: AiPlan = { ...basePlan(ctx, { targetId: TARGET_ID, method: 'package', nextStep: 'confirmInApp', displayTarget: '', sentenceKey: 'aiConnectPlanPackage' }), instructions: INSTRUCTIONS };
		return useConfigRoute(ctx) ? fallback.plan(ctx, det, rec, base) : primary.plan(ctx, det, rec, base);
	},

	apply: (ctx, det, rec) => useConfigRoute(ctx) ? fallback.apply(ctx, det, rec) : primary.apply(ctx, det, rec),

	remove: async (ctx, rec) => {
		if (rec.method == 'config') {
			// S8: deciding whose the entry is and deleting it, one at a time across profiles. Not acquired: nothing queued, nothing deleted
			const res = await configLock(ctx.env, () => removeConfig(ctx, rec));
			return res || { ok: false, error: err('write', 'changed') };
		};

		// The extension: nothing of Anytype's outside to change; the key is queued, then revoked by the renderer
		if (ctx.queue && !ctx.queue()) {
			return { ok: false, error: err('write', 'unsaved') };
		};

		const state = extensionState(ctx.env, bundleInfo(ctx.env));
		return { ok: true, ...([ 'installed', 'disabled', 'outdated' ].includes(state) ? { left: 'extension' as const } : {}) };
	},

	check: async (ctx, rec): Promise<CheckOutcome> => {
		const routes = claudeRoutes(ctx.env);

		// One connection, one server: both there → the user removes one
		if (routes.config && routes.extension) {
			return { status: 'conflict', bothRoutes: true };
		};

		if (rec.method == 'config') {
			const t = loadConfig(ctx.env, recordConfig(rec) || undefined);

			if ('error' in t) {
				return { status: 'unreadable' };
			};
			if (!present(t.value)) {
				return { status: rec.observedInstalled ? 'removed' : 'pending' };
			};
			// Not the entry Anytype recorded (edited, another account's key, another channel's command): Reconnect
			if (!entryOurs(t.value, rec)) {
				return { status: 'reconnect' };
			};
			// The entry starts the stable copy: installed or updated by the running Anytype (never downgraded on macOS and Windows)
			if (!('path' in (await ensureInstalled(ctx.env)))) {
				return { status: 'reconnect', observedInstalled: true };
			};
			return { status: 'ok', observedInstalled: true };
		};

		const info = extensionInfo(ctx.env, bundleInfo(ctx.env));

		if (!info.verified) {
			return { status: ((info.state == 'absent') && rec.observedInstalled) ? 'removed' : 'pending', install: { state: 'finish', version: '', installedAt: '' } };
		};

		// Settled by the service from heart's isActive and this identity (the latch). "On" only when Claude's settings
		// say `isEnabled: true`; settings that can't be read decide nothing (no confirmation, the latch kept)
		const identity = { version: info.version, installedAt: info.installedAt };
		const state = (info.state == 'installed') ? 'on' : ((info.state == 'disabled') ? 'off' : 'unknown');

		return { status: 'pending', observedInstalled: true, install: { state, ...identity } };
	},

	update: async (ctx, rec, change) => {
		// stdio routes need nothing for a port change (the endpoint file); a tier change is a Reconnect
		if (change.tier && (change.tier != rec.tier)) {
			return { ok: false, error: err('validate', (rec.method == 'package') ? 'unknown' : 'unsupportedForm') };
		};
		return { ok: true, nextStep: rec.nextStep };
	},

	installedFp: async (ctx, rec) => (rec.method == 'config') ? entryKeyFp(ctx.env, rec.configPath || rec.targetPath) : null,

	canRestart: (env, det) => det.installed && (((env.platform == 'darwin') && !!det.appPath) || ((env.platform == 'win32') && !!det.exePath)),
};

