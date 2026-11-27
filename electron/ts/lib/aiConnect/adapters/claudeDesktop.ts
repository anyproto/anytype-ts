/**
 * Claude Desktop (targetId `claude-desktop`).
 *
 * The key lives in the forwarder's item for the connection `claude-desktop` (one private file, written only
 * through `anytype-mcp key …`; see item.ts and plan §3). Nothing here reads or writes that file.
 *
 * Primary (macOS, Windows): one static `Anytype.mcpb` (a `binary` bundle with the signed forwarder inside,
 * no key). The extension's state decides: installed / disabled → `key set` only; on a signed build an
 * extension that isn't verified (expected id, version ≥ the bundle's, the expected signer) gets no key: the
 * bundle is opened and NOTHING is written (`needs: 'installExtension'`) until the verified one is there;
 * absent / unreadable on an unsigned build → `key set` (commit), then the bundle is copied and opened. A
 * bundle whose archive fails its digest check is never used.
 *
 * Config route (`method: 'config'`; the only route on Linux, needs forwarder.stdioSupported): Claude must be
 * closed (consent before any key exists), the stable copy is installed (`~/.anytype/bin`), the keyless entry
 * `anytype-mcp serve --connection claude-desktop` is merged into claude_desktop_config.json, `key set` is the
 * commit, and Claude is relaunched on every path after Anytype quit it. It needs no extension; with the
 * Anytype extension installed and enabled as well the plan is refused (two servers for one connection).
 * - Ownership of that entry = canonicalDigest(entry) === rec.entryDigest. An entry identical to the command
 *   Anytype writes today holds no key and is the same for every account, so it never needs a Replace.
 * - Two objects can be someone else's (the entry and the item): Replace is offered bound to the one that is
 *   foreign; when both are, the plan is manual-only (one consent can't stand for both).
 * - Running state unknown (Linux: no verified executable; Windows MSIX; a failed process query): the user
 *   quits Claude and confirms (`quitConfirmed`). Before every config write the state is read again: a
 *   running Claude (a new instance, or several processes, included) is never written behind.
 * - The entry's and the item's presence come from the snapshot taken BEFORE Claude was quit: one that
 *   vanished while Claude quit is the user's removal, never re-added.
 * - A failed relaunch is reported (`openFailed`, restart step; `error.openFailed` on a failed apply); a
 *   rollback that can't put the previous entry back is reported (`error.left: 'entry'`).
 *
 * Manual (`ctx.manual`): Anytype's side only (the item, the stable copy or the bundle copy); nothing is
 * opened, no config edit, no quit. The record waits (pending) until check sees the extension or the entry.
 *
 * Check: an unreadable config on the config route is `unreadable`; a port or tier change is a
 * `key retarget` (never a new key); a failed heal is `reconnect`; an owned entry that isn't today's command
 * is rewritten while Claude is stopped, else `reconnect`.
 *
 * Extension state files (UNVERIFIED field names, no extension was installed on the dev Mac):
 * `extensions-installations.json` → the record of the extension id (version, signatureInfo), and
 * `Claude Extensions Settings/<id>.json` → `isEnabled`.
 */
import type { Adapter, AiError, AiPlan, AiRecord, AiStep, ApplyOutcome, CheckOutcome, Ctx, Detected, Env } from '../types';
import { dirsWritable, isLocalAbsolute, pathOf, readSnapshot, resolveTarget, writeFileSafe } from '../fsSafe';
import { canonicalDigest } from '../digest';
import { claudeDesktopDir, powershellPath } from '../detect';
import { BUNDLE_NAME, bundleDir, bundleInfo, bundleUsable, copyBundle, ensureStoreDir, loadBundle, type BundleInfo } from '../bundle';
import { buildMeta, ensureInstalled, serveCommand, stdioSupported, usable, withLock } from '../forwarder';
import { commitItem, deleteItem, itemState, retargetItem, type ItemState } from '../item';
import { UTF8_OUTPUT, launch, quit, runningState } from '../restart';
import { basePlan, displayPath, err, goneError, manualPlan, mayWrite, mergeStep, protectedError, protectedTarget, stillLive } from './common';
import { jsonFormat } from './jsonEntry';

export const TARGET_ID = 'claude-desktop';
/** `local.mcpb.<author>.<name>` from the manifest (author "Anytype", name "anytype"); never changes (§5) */
export const EXTENSION_ID = 'local.mcpb.anytype.anytype';
/** A build whose metadata says `signed: false` names its bundle `anytype-dev`: a separate extension */
export const EXTENSION_ID_DEV = 'local.mcpb.anytype.anytype-dev';

export const extensionId = (env: Env): string => buildMeta(env)?.signed ? EXTENSION_ID : EXTENSION_ID_DEV;
export const INSTALLATIONS_FILE = 'extensions-installations.json';
export const SETTINGS_DIR = 'Claude Extensions Settings';

export type ExtensionState = 'installed' | 'disabled' | 'outdated' | 'absent' | 'unreadable';

export interface ExtensionInfo {
	state: ExtensionState;
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

	if (installations.kind != 'ok') {
		return { state: 'unreadable', present: (installations.kind == 'missing') ? 'none' : 'unknown', verified: false, enabled: false };
	};

	const id = extensionId(env);
	const record = installationRecord(installations.value, id);

	if (!record) {
		return { state: 'absent', present: 'none', verified: false, enabled: false };
	};

	// Read for every record, also an outdated one: Claude runs whatever is installed and switched on
	const settings = readClaudeJson(env, P.join(dir, SETTINGS_DIR, `${id}.json`));
	const enabled = (settings.kind == 'ok') ? settings.value?.isEnabled : undefined;
	const on = (enabled !== false);
	const version = String(record.version || record.manifest?.version || '');
	const versionOk = bundleUsable(bundle) && !!version && (compareVersions(version, bundle.version) >= 0);
	const signerOk = bundleUsable(bundle) && (!bundle.signed || (signerOf(record) === bundle.signerFingerprint));

	if (!versionOk || !signerOk) {
		return { state: 'outdated', present: 'record', verified: false, enabled: on };
	};

	if (typeof enabled != 'boolean') {
		return { state: 'unreadable', present: 'record', verified: true, enabled: on };
	};
	return { state: enabled ? 'installed' : 'disabled', present: 'record', verified: true, enabled: on };
};

export const extensionState = (env: Env, bundle: BundleInfo | null): ExtensionState => extensionInfo(env, bundle).state;

/** The key may go to the installed extension on the bundle route: unsigned development build by state, a signed one only when verified */
const extensionReady = (bundle: BundleInfo, info: ExtensionInfo): boolean => bundle.signed ? info.verified : ((info.state == 'installed') || (info.state == 'disabled'));

const configFile = (env: Env): string => pathOf(env).join(claudeDesktopDir(env), 'claude_desktop_config.json');

/** The entry Anytype writes into Claude's config: the stable copy, no key, no `env` */
const entryOf = (env: Env) => serveCommand(env, TARGET_ID);

/**
 * A manual plan that prepares the item ("Create key" runs `key set`, `manualPrepare`) names the item as its
 * target, with the Replace an item of someone else's needs: the renderer binds Create key to it
 * (`previewTarget`, X7). Without a usable store the plan stays without a target (not actionable).
 */
const manualKeyPlan = async (ctx: Ctx, rec: AiRecord | null, plan: AiPlan, error: AiError, steps: AiStep[]): Promise<AiPlan> => {
	const prepares = steps.some(s => s.textKey == 'aiConnectManualPrepare');
	const manual = manualPlan(plan, error, steps);
	const own = prepares ? await itemState(ctx.env, TARGET_ID, rec, ctx.accountId) : null;

	if (!own || ('error' in own)) {
		return manual;
	};

	const ret: AiPlan = { ...manual, targetPath: own.label, existing: own.existing };

	if (own.existing == 'foreign') {
		ret.replace = { targetPath: own.label, foreignDigest: own.digest };
	};
	return ret;
};

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
const openBundle = async (ctx: Ctx, det: Detected, file: string): Promise<boolean> => {
	if (ctx.env.platform == 'darwin') {
		if (!det.appPath) {
			return false;
		};
		return (await ctx.env.run('/usr/bin/open', [ '-a', det.appPath, file ], { timeout: 10000 })).code == 0;
	};
	if (ctx.env.platform == 'win32') {
		const exe = await windowsClaudeExe(ctx.env, det);
		return exe ? ctx.env.launch(exe, [ file ]) : false;
	};
	return false;
};

const primarySteps = (env: Env): AiStep[] => [
	{ textKey: 'aiConnectManualPrepare' },
	{ textKey: 'aiConnectManualInstallFile', path: pathOf(env).join(bundleDir(env), BUNDLE_NAME) },
	{ textKey: 'aiConnectStepRestartSelf', args: [ 'Claude' ] },
];

const configSteps = (env: Env): AiStep[] => [
	{ textKey: 'aiConnectManualPrepare' },
	mergeStep({ mcpServers: { anytype: entryOf(env) } }, configFile(env)),
	{ textKey: 'aiConnectStepRestartSelf', args: [ 'Claude' ] },
];

const useConfigRoute = (ctx: Ctx): boolean => (ctx.method == 'config') || (ctx.env.platform == 'linux');

/** An Anytype extension is installed and not switched off (any version, any signer): the config route would start a second server for the same connection (Q14) */
const extensionEnabled = (env: Env): boolean => {
	const info = extensionInfo(env, bundleInfo(env));

	// S9: an installation registry that exists but can't be read (too large, damaged) may describe an enabled
	// extension; only a missing one says there is none
	return info.enabled || (info.present == 'unknown');
};

/**
 * S8: Claude's config entry is the same text for every account and every Anytype profile, so the steps that
 * decide whose it is and then change it — an apply from the config merge through `key set`, a removal from
 * `key delete` through the config edit — run one at a time across processes: an exclusive
 * `~/.anytype/ai-connect/claude-desktop.lock` (beside the item folders, never inside one; the wait and the
 * staleness of the stable copy's lock). null: not acquired, and nothing was done.
 */
const LOCK_NAME = 'claude-desktop.lock';
const configLock = async <T>(env: Env, fn: () => Promise<T>): Promise<T | null> => ((await ensureStoreDir(env)) ? withLock(env, bundleDir(env), fn, LOCK_NAME) : null);

/** What a committed `key set` becomes: the outcome, or the unconfirmed one the service keeps as a candidate */
const unconfirmedOutcome = (method: 'keyfile' | 'package' | 'config', nextStep: 'restart' | 'toggle' | 'confirmInApp', targetPath: string, running?: boolean): ApplyOutcome => ({
	ok: true, method, nextStep, targetPath, observedInstalled: false, createdDirs: [], unconfirmed: true, ...(running ? { running: true } : {}),
});

// ---------------------- primary: bundle + item ---------------------- //

const primary = {
	plan: async (ctx: Ctx, rec: AiRecord | null, base: AiPlan): Promise<AiPlan> => {
		const bundle = bundleInfo(ctx.env);
		const plan: AiPlan = { ...base, steps: primarySteps(ctx.env), bundleSigned: !!bundle?.signed };

		if (!bundleUsable(bundle)) {
			// No bundle to install (damaged, or a build without one): the config route by hand, where it can run
			const steps = usable(ctx.env).ok ? configSteps(ctx.env) : [];

			// S9: the same guard as the config route's own plan — no Create key that `manualPrepare` would then refuse
			if (extensionEnabled(ctx.env)) {
				return { ...manualPlan(plan, err('validate', 'conflict'), []), note: 'aiConnectClaudeBothRoutes' };
			};
			return manualKeyPlan(ctx, rec, { ...plan, steps }, err('verify', 'unsupportedPackage'), steps);
		};

		const own = await itemState(ctx.env, TARGET_ID, rec, ctx.accountId);

		if ('error' in own) {
			return manualPlan(plan, own.error, []);
		};

		plan.displayTarget = displayPath(ctx.env, own.label);
		plan.targetPath = own.label;
		plan.existing = own.existing;
		if (own.existing == 'foreign') {
			plan.replace = { targetPath: own.label, foreignDigest: own.digest };
		};

		const info = extensionInfo(ctx.env, bundle);

		if (extensionReady(bundle, info)) {
			return { ...plan, method: 'keyfile', nextStep: (info.state == 'disabled') ? 'toggle' : 'restart', sentenceKey: 'aiConnectPlanKeyfile' };
		};
		return { ...plan, method: 'package', nextStep: 'confirmInApp', sentenceKey: 'aiConnectPlanPackage' };
	},

	apply: async (ctx: Ctx, det: Detected, rec: AiRecord | null): Promise<ApplyOutcome> => {
		const loaded = loadBundle(ctx.env);
		const bundle = loaded?.info || null;

		if (!loaded || !bundleUsable(bundle)) {
			return { ok: false, error: err('verify', 'unsupportedPackage') };
		};

		const info = extensionInfo(ctx.env, bundle);

		// Signed build, the installed extension not verified (absent, unreadable, another signer or version): the key must not exist yet
		if (bundle.signed && !info.verified) {
			const copy = await copyBundle(ctx.env, loaded.data);

			if (!('path' in copy)) {
				return { ok: false, error: copy.error };
			};

			const opened = await openBundle(ctx, det, copy.path);
			return opened ? { ok: false, needs: 'installExtension' } : { ok: false, needs: 'installExtension', openFailed: true };
		};

		const ready = extensionReady(bundle, info);
		const method = ready ? 'keyfile' : 'package';
		const nextStep = ready ? ((info.state == 'disabled') ? 'toggle' : 'restart') : 'confirmInApp';
		// Commit: the item
		const res = await commitItem(ctx, TARGET_ID, rec, { method, route: ctx.route, nextStep });

		if ('unconfirmed' in res) {
			return unconfirmedOutcome(method, nextStep, res.label, res.running);
		};
		if ('error' in res) {
			return { ok: false, error: res.error };
		};
		if (ready) {
			return { ok: true, method, nextStep, targetPath: res.label, observedInstalled: true, createdDirs: [], itemRev: res.rev };
		};

		const copy = await copyBundle(ctx.env, loaded.data);
		const opened = ('path' in copy) && (await openBundle(ctx, det, copy.path));

		return { ok: true, method, nextStep, targetPath: res.label, observedInstalled: false, createdDirs: [], itemRev: res.rev, ...(opened ? {} : { openFailed: true }) };
	},
};

// ---------------------- manual: Anytype's side only ---------------------- //

/**
 * "Set up manually" → Create key: the item (and, for the bundle route, the bundle copy the user installs;
 * for the config route, the stable copy the entry starts); nothing is opened, no config is edited, Claude
 * is not quit. The config route records the entry it shows, so check recognises it once the user added
 * exactly that.
 */
const manualPrepare = async (ctx: Ctx, rec: AiRecord | null): Promise<ApplyOutcome> => {
	const loaded = loadBundle(ctx.env);
	const bundle = loaded?.info || null;

	if (useConfigRoute(ctx) || !loaded || !bundleUsable(bundle)) {
		// One connection, one server (Q14): checked before anything is installed or stored
		if (extensionEnabled(ctx.env)) {
			return { ok: false, error: err('validate', 'conflict') };
		};

		// The entry the user is told to add must be able to start
		const installed = await ensureInstalled(ctx.env);

		if (!('path' in installed)) {
			return { ok: false, error: installed.error };
		};

		const entry = entryOf(ctx.env);
		const target = resolveTarget(ctx.env, configFile(ctx.env));
		// S8: one at a time with another profile's removal (which decides by the item whose the entry is)
		const res = await configLock(ctx.env, () => commitItem(ctx, TARGET_ID, rec, {
			method: 'config', route: ctx.route, nextStep: 'restart',
			...(('real' in target) ? { targetPath: target.real, configEntry: entry, entryDigest: canonicalDigest(entry), configPath: target.real } : {}),
		}));

		if (!res) {
			return { ok: false, error: err('write', 'changed') };
		};
		if ('unconfirmed' in res) {
			return unconfirmedOutcome('config', 'restart', ('real' in target) ? target.real : res.label, res.running);
		};
		if ('error' in res) {
			return { ok: false, error: res.error };
		};

		return {
			ok: true, method: 'config', nextStep: 'restart', targetPath: ('real' in target) ? target.real : res.label, observedInstalled: false, createdDirs: [],
			configEntry: entry, entryDigest: canonicalDigest(entry), itemRev: res.rev, ...(('real' in target) ? { configPath: target.real } : {}),
		};
	};

	const info = extensionInfo(ctx.env, bundle);
	const copy = await copyBundle(ctx.env, loaded.data);

	if (!('path' in copy)) {
		return { ok: false, error: copy.error };
	};
	// The user installs the signed bundle first; the key follows once the verified extension is there
	if (bundle.signed && !info.verified) {
		return { ok: false, needs: 'installExtension' };
	};

	const ready = extensionReady(bundle, info);
	const method = ready ? 'keyfile' : 'package';
	const nextStep = ready ? ((info.state == 'disabled') ? 'toggle' : 'restart') : 'confirmInApp';
	const res = await commitItem(ctx, TARGET_ID, rec, { method, route: ctx.route, nextStep });

	if ('unconfirmed' in res) {
		return unconfirmedOutcome(method, nextStep, res.label, res.running);
	};
	if ('error' in res) {
		return { ok: false, error: res.error };
	};
	return { ok: true, method, nextStep, targetPath: res.label, observedInstalled: ready, createdDirs: [], itemRev: res.rev };
};

// ---------------------- config route: config entry + item ---------------------- //

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

/** The entry this record wrote (its digest); decides heal, remove and rollback */
const entryOurs = (value: any, rec: AiRecord | null): boolean => present(value) && !!rec?.entryDigest && (canonicalDigest(value) == rec.entryDigest);

/** Exactly the entry Anytype writes today: no key in it, the same for every account; writing it again changes nothing */
const entryShared = (env: Env, value: any): boolean => present(value) && (canonicalDigest(value) == canonicalDigest(entryOf(env)));

/** A replace consent that names exactly this config entry */
const entryConsent = (ctx: Ctx, t: ConfigTarget): boolean => present(t.value) && !!ctx.replace && (ctx.replace.targetPath == t.real) && (ctx.replace.foreignDigest == canonicalDigest(t.value));

/**
 * Sets (or removes, with undefined) `mcpServers.anytype`; one retry on `changed`. `expect` runs before
 * every attempt: null → write; an error → refused; 'skip' → nothing to do.
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

		const res = await writeFileSafe(env, t.real, edit.text, { snapshot: t.snapshot, secret: false });

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
		const plan: AiPlan = { ...base, method: 'config', nextStep: 'restart', sentenceKey: 'aiConnectPlanConfigRestart', steps: configSteps(ctx.env) };

		// Stated before any key exists: this package can't be started by Claude
		if (!stdioSupported(ctx.env)) {
			return { ...plan, canApply: false, method: 'manual', error: err('detect', 'unsupportedPackage'), note: 'aiConnectLinuxPackageLimit', steps: [] };
		};

		// The forwarder this build ships must be there and match its metadata, or no entry could start
		const own0 = usable(ctx.env);

		if (!('path' in own0)) {
			return manualPlan(plan, own0.error, []);
		};
		// One connection, one server: with the extension switched on as well, Claude would run two
		if (extensionEnabled(ctx.env)) {
			return { ...manualPlan(plan, err('validate', 'conflict'), []), note: 'aiConnectClaudeBothRoutes' };
		};

		const t = loadConfig(ctx.env);

		if ('error' in t) {
			return manualKeyPlan(ctx, rec, plan, t.error, plan.steps);
		};

		// The writer's own edit and directory rules on the previewed file
		const dry = CONFIG.set(t.text, entryOf(ctx.env));

		if (!('text' in dry)) {
			return manualKeyPlan(ctx, rec, plan, err('parse', dry.category, t.real), plan.steps);
		};

		const dirs = dirsWritable(ctx.env, t.real);

		if (dirs) {
			return manualKeyPlan(ctx, rec, plan, dirs, plan.steps);
		};

		const own = await itemState(ctx.env, TARGET_ID, rec, ctx.accountId);

		if ('error' in own) {
			return manualPlan(plan, own.error, []);
		};

		const configForeign = present(t.value) && !entryOurs(t.value, rec) && !entryShared(ctx.env, t.value);
		const keyForeign = own.existing == 'foreign';

		plan.displayTarget = displayPath(ctx.env, t.real);
		plan.targetPath = t.real;

		// One Replace can't stand for two objects someone else owns: the user removes one first
		if (configForeign && keyForeign) {
			return manualPlan(plan, err('validate', 'conflict', t.real), []);
		};
		if (configForeign) {
			plan.existing = 'foreign';
			plan.replace = { targetPath: t.real, foreignDigest: canonicalDigest(t.value) };
		} else
		if (keyForeign) {
			plan.existing = 'foreign';
			plan.replace = { targetPath: own.label, foreignDigest: own.digest };
		} else
		if (entryOurs(t.value, rec) || (own.existing == 'ours')) {
			plan.existing = 'ours';
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
		if (extensionEnabled(ctx.env)) {
			return { ok: false, error: err('validate', 'conflict') };
		};

		const entry = entryOf(ctx.env);
		const digest = canonicalDigest(entry);
		const needs = (ctx.env.platform == 'linux') ? 'quitAppSelf' : 'quitApp';

		// Everything that can refuse is checked before Claude is touched: the edit, the forwarder, both owners
		const baseline = async (): Promise<{ pre: ConfigTarget; own: Extract<ItemState, { ok: true }> } | { ok: false; error: AiError }> => {
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

			// The entry must be able to start: the stable copy, installed or updated now
			const installed = await ensureInstalled(ctx.env);

			if (!('path' in installed)) {
				return { ok: false, error: installed.error };
			};

			const own = await itemState(ctx.env, TARGET_ID, rec, ctx.accountId);

			if ('error' in own) {
				return { ok: false, error: own.error };
			};
			if (present(pre.value) && !entryOurs(pre.value, rec) && !entryShared(ctx.env, pre.value) && !entryConsent(ctx, pre)) {
				return { ok: false, error: err('validate', 'conflict', pre.real) };
			};
			if ((own.existing == 'foreign') && !(ctx.replace && (ctx.replace.targetPath == own.label) && (ctx.replace.foreignDigest == own.digest))) {
				return { ok: false, error: err('validate', 'conflict', own.label) };
			};
			return { pre, own };
		};
		const first = await baseline();

		if (!('pre' in first)) {
			return first;
		};

		// What was there before Claude was quit decides whether the entry and the item may be created
		let entryWasPresent = present(first.pre.value);
		let keyWasPresent = first.own.existing != 'none';
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
			return ('error' in outcome) ? { ok: false, error: { ...outcome.error, openFailed: true } } : { ...outcome, openFailed: true };
		};

		/** Claude may be written behind: stopped, or unknown after the user confirmed they quit it */
		const mayEdit = async (): Promise<boolean> => {
			const now = await runningState(ctx.env, det);
			return (now.state == 'stopped') || ((now.state == 'unknown') && !!ctx.quitConfirmed);
		};

		// S8: from the config merge through `key set`, one at a time with every other profile's apply and removal.
		// Waiting for Claude to quit happened above, outside the lock
		const locked = await configLock(ctx.env, async (): Promise<ApplyOutcome> => {
			// Nothing was done to Claude: what is there now, under the lock, is the state to judge by (another
			// profile's removal may have finished while this call waited). After a quit the earlier reading stands
			if (!quitted) {
				const again = await baseline();

				if (!('pre' in again)) {
					return again;
				};
				entryWasPresent = present(again.pre.value);
				keyWasPresent = again.own.existing != 'none';
			};

			let previous: any;

			const merged = await writeConfigEntry(ctx.env, entry, async t => {
				if (!(await mayEdit())) {
					return STILL_RUNNING;
				};

				const here = present(t.value);

				previous = t.value;

				const verdict = mayWrite({
					mode: 'install', present: here, owned: here && (entryOurs(t.value, rec) || entryShared(ctx.env, t.value)), consent: entryConsent(ctx, t),
					consentHere: ctx.replace?.targetPath == t.real, wasPresent: entryWasPresent,
				});

				if (verdict == 'conflict') {
					return err('validate', 'conflict', t.real);
				};
				return (verdict == 'gone') ? goneError('install', t.real) : null;
			});

			if ('error' in merged) {
				return (merged.error.stage == 'restart') ? { ok: false, needs } : { ok: false, error: merged.error };
			};

			const done: ApplyOutcome = {
				ok: true,
				method: 'config',
				nextStep: quitted ? 'none' : 'restart',
				targetPath: merged.real,
				observedInstalled: true,
				createdDirs: merged.createdDirs,
				configEntry: entry,
				entryDigest: digest,
				configPath: merged.real,
			};
			// Commit: the item (one that vanished while Claude quit is not recreated)
			// Q15: the candidate carries the entry this call wrote, so a recovery after a crash still owns it
			const key = await commitItem(ctx, TARGET_ID, rec, {
				method: 'config', route: ctx.route, nextStep: done.nextStep, targetPath: merged.real, configEntry: entry, entryDigest: digest, configPath: merged.real,
			}, keyWasPresent);

			if ('unconfirmed' in key) {
				// The entry stays: the item may hold the new key, and the next check settles it
				return { ...done, observedInstalled: false, unconfirmed: true, ...(key.running ? { running: true } : {}) };
			};
			if ('error' in key) {
				// The previous value goes back only while the entry still is exactly what this call wrote; else it is left (and reported)
				const rollback = await writeConfigEntry(ctx.env, previous, async t => {
					if (!present(t.value)) {
						return 'skip';
					};
					return (canonicalDigest(t.value) == digest) ? null : err('validate', 'conflict', t.real);
				}, merged.real);

				return { ok: false, error: { ...key.error, ...(('error' in rollback) ? { left: 'entry' as const } : {}) } };
			};

			return { ...done, itemRev: key.rev };
		});

		// The lock could not be taken (another profile is at it): nothing was written
		return finish(locked || { ok: false, error: err('write', 'changed') });
	},
};

/** The config file a record's entry was written to (recorded at install); '' when it has none */
const recordConfig = (rec: AiRecord): string => rec.configPath || (((rec.method == 'config') && rec.entryDigest) ? rec.targetPath : '');

const removeLocked = async (ctx: Ctx, rec: AiRecord): Promise<Awaited<ReturnType<Adapter['remove']>>> => {
	// The item first: only this record's own (another account's, or none, is done)
	const item = await deleteItem(ctx.env, TARGET_ID, rec);

	let left: 'extension' | 'entry' | undefined;
	// Bound to the file the entry was written to, never another profile's config resolved today
	const cfg = recordConfig(rec);
	const t = cfg ? loadConfig(ctx.env, cfg) : { error: err('read', 'notFound') };

	// Q5: the entry is the same text for every account, so the item says whose it is now. Another account's
	// item: the entry is theirs, left alone and not reported. An item that may still be there: the entry stays too
	const foreign = ('owner' in item) && (item.owner == 'foreign');

	// Anytype wrote an entry but the config can't be inspected now: it may still be there
	if (!foreign && ('error' in t) && cfg && rec.entryDigest && (t.error.category != 'notFound')) {
		left = 'entry';
	} else
	if (!foreign && !('error' in t) && entryOurs(t.value, rec) && !item.done) {
		left = 'entry';
	} else
	if (!foreign && !('error' in t) && entryOurs(t.value, rec)) {
		const det = ctx.detections.find(d => d.appId == 'claude-desktop');
		const running = det ? await runningState(ctx.env, det) : { state: 'unknown' as const };

		if (running.state == 'stopped') {
			const res = await writeConfigEntry(ctx.env, undefined, async cur => entryOurs(cur.value, rec) ? null : err('validate', 'conflict', cur.real), cfg);
			left = ('error' in res) ? 'entry' : undefined;
		} else {
			left = 'entry';
		};
	};

	const state = extensionState(ctx.env, bundleInfo(ctx.env));

	if (!left && [ 'installed', 'disabled', 'outdated' ].includes(state)) {
		left = 'extension';
	};
	return { ok: true, ...(left ? { left } : {}), ...(item.done ? {} : { itemLeft: true }) };
};

// ---------------------- the adapter ---------------------- //

export const claudeDesktop: Adapter = {
	ids: [ 'claude-desktop' ],
	target: (env, det) => (det.targetId && det.targetPaths[0]) ? { targetId: det.targetId, path: det.targetPaths[0] } : null,

	plan: async (ctx, det, rec) => {
		const base: AiPlan = { ...basePlan(ctx, { targetId: TARGET_ID, method: 'package', nextStep: 'confirmInApp', displayTarget: '', sentenceKey: 'aiConnectPlanPackage' }), instructions: INSTRUCTIONS };
		return useConfigRoute(ctx) ? fallback.plan(ctx, det, rec, base) : primary.plan(ctx, rec, base);
	},

	apply: (ctx, det, rec) => {
		if (ctx.manual) {
			return manualPrepare(ctx, rec);
		};
		return useConfigRoute(ctx) ? fallback.apply(ctx, det, rec) : primary.apply(ctx, det, rec);
	},

	remove: async (ctx, rec) => {
		// S8: from `key delete` through the config edit under the lock — the item says whose the entry is, and no
		// other profile may connect between that answer and the edit. Not acquired: nothing is deleted, the
		// record keeps `itemDelete` and the next check tries again
		const res = await configLock(ctx.env, () => removeLocked(ctx, rec));

		return res || { ok: true, ...(recordConfig(rec) ? { left: 'entry' as const } : {}), itemLeft: true };
	},

	check: async (ctx, rec): Promise<CheckOutcome> => {
		const own = await itemState(ctx.env, TARGET_ID, rec, rec.accountId);

		if ('error' in own) {
			return { status: 'unreadable' };
		};
		if (own.existing == 'foreign') {
			return { status: 'conflict' };
		};
		if (own.existing == 'none') {
			return { status: rec.observedInstalled ? 'removed' : 'pending' };
		};

		const cfg = recordConfig(rec);
		const t = cfg ? loadConfig(ctx.env, cfg) : loadConfig(ctx.env);

		// The config route's own file can't be read: unreadable, never "removed"
		if (('error' in t) && (rec.method == 'config')) {
			return { status: 'unreadable' };
		};

		const configValue = ('error' in t) ? undefined : t.value;

		if (rec.entryDigest && present(configValue) && !entryOurs(configValue, rec)) {
			return { status: 'conflict' };
		};

		let item = { rev: own.rev, port: own.port, tier: own.tier };
		let healed = false;

		// A retarget whose receipt was lost: the item says what happened, and the record follows it (never healed back)
		const tier = rec.retarget ? own.tier : rec.tier;

		if (ctx.port && ((own.port != ctx.port) || (own.tier != tier))) {
			// The API stopped meanwhile: no heal (the service keeps the last status)
			if (!stillLive(ctx)) {
				return { status: 'pending', item };
			};

			const res = await retargetItem(ctx, TARGET_ID, rec, { port: ctx.port, tier });

			if ('unconfirmed' in res) {
				// The same key either way: the next check reads what the item holds
				return { status: 'pending' };
			};
			if ('error' in res) {
				return ('gone' in res) ? { status: rec.observedInstalled ? 'removed' : 'pending' } : { status: 'reconnect', item };
			};
			item = { rev: res.rev, port: ctx.port, tier };
			healed = true;
		};

		// The config route starts the stable copy: installed or updated by the running Anytype (never downgraded on macOS and Windows)
		if ((rec.method == 'config') && !('path' in (await ensureInstalled(ctx.env)))) {
			return { status: 'reconnect', observedInstalled: true, item, ...(healed ? { healed: true, nextStep: 'restart' as const } : {}) };
		};

		// Our entry, but not the command this Anytype writes (another channel's copy, a moved home): rewritten
		// while Claude is stopped; else attention
		let rewritten: { configEntry: AiRecord['configEntry']; entryDigest: string } | null = null;
		const today = entryOf(ctx.env);

		if (entryOurs(configValue, rec) && !entryShared(ctx.env, configValue)) {
			const det = ctx.detections.find(d => d.appId == 'claude-desktop');
			const fixable = 'path' in (await ensureInstalled(ctx.env));
			const running = (det && fixable) ? await runningState(ctx.env, det) : { state: 'unknown' as const };
			// Re-checked right before every write attempt: the process lookup above takes time (B2)
			const res = (running.state == 'stopped') ? await writeConfigEntry(ctx.env, today, async cur => {
				if (!stillLive(ctx)) {
					return err('key', 'apiOff');
				};
				return entryOurs(cur.value, rec) ? null : err('validate', 'conflict', cur.real);
			}, cfg || undefined) : null;

			if (!res || ('error' in res)) {
				return { status: 'reconnect', observedInstalled: true, item, ...(healed ? { healed: true, nextStep: 'restart' as const } : {}) };
			};
			rewritten = { configEntry: today, entryDigest: canonicalDigest(today) };
		};

		const heal = { item, ...((healed || rewritten) ? { healed: true, nextStep: 'restart' as const, ...(rewritten || {}) } : {}) };

		if (rec.method == 'config') {
			return entryOurs(configValue, rec) ? { status: 'ok', observedInstalled: true, ...heal } : { status: rec.observedInstalled ? 'removed' : 'pending', ...heal };
		};

		switch (extensionState(ctx.env, bundleInfo(ctx.env))) {
			case 'installed': return { status: 'ok', observedInstalled: true, ...heal };
			case 'disabled': return { status: 'ok', observedInstalled: true, ...heal, nextStep: 'toggle' };
			case 'absent': return { status: rec.observedInstalled ? 'removed' : 'pending', ...heal };
			default: return { status: 'pending', ...heal };
		};
	},

	update: async (ctx, rec, change) => {
		const res = await retargetItem(ctx, TARGET_ID, rec, { port: change.port || rec.port, tier: change.tier || rec.tier });

		if ('unconfirmed' in res) {
			// Nothing to revoke either way; the next check takes what the item holds
			return { ok: false, unconfirmed: true, error: err('write', 'timeout') };
		};
		return ('error' in res) ? { ok: false, error: res.error } : { ok: true, nextStep: 'restart' };
	},

	installedFp: async (ctx, rec) => {
		const own = await itemState(ctx.env, TARGET_ID, rec, rec.accountId);

		if ('error' in own) {
			return 'unreadable';
		};
		// Only this account's item can hold one of the record's keys
		return (('fingerprint' in own) && (own.account == rec.accountId)) ? own.fingerprint : null;
	},

	canRestart: (env, det) => det.installed && (((env.platform == 'darwin') && !!det.appPath) || ((env.platform == 'win32') && !!det.exePath)),
};
