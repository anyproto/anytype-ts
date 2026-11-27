/**
 * Hermes Agent (targetId `hermes`), its DEFAULT profile only: ~/.hermes, %LOCALAPPDATA%\hermes on Windows.
 * Other profiles (~/.hermes/profiles/<name>) get the manual steps.
 *
 * - The key: `MCP_ANYTYPE_API_KEY=<key>` in <profile>/.env (the profile folder, never next to a resolved
 *   config.yaml), written FIRST: a running gateway re-reads config.yaml and must find the variable. Only our
 *   line changes, no backup copy of the file is left, a multiline value refuses the file (envFile).
 * - The entry: `mcp_servers.anytype = { url, headers: { Authorization: "Bearer ${MCP_ANYTYPE_API_KEY}" } }` in
 *   config.yaml, lossless or refused (yamlFile). Hermes resolves the variable from the profile's .env.
 * - The variable must be free or ours: no other value in .env (rotation: the record's key), and nothing in
 *   config.yaml outside our entry mentions it. Checked in the plan, before apply and on every write attempt.
 * - Ownership: the entry has exactly that shape AND the .env key's fingerprint is the record's.
 * - When anything is unusual (an `anytype` entry Anytype didn't write, a used variable, a file that can't be
 *   edited losslessly): manual steps with the entry under `anytype_me` and its own variable. Never replaced.
 * - Next: /reload-mcp in Hermes, or a new session. No CLI route: `hermes mcp add` is interactive.
 */
import type { Adapter, AiError, AiPlan, AiRecord, AiStep, ApplyOutcome, Ctx, Detected, Env } from '../types';
import { pathOf, readSnapshot, resolveTarget, writeFileSafe, type Snapshot } from '../fsSafe';
import { keyFingerprint } from '../digest';
import { hermesHome } from '../detect';
import { envUsable, readEnvVar, removeEnvVar, setEnvVar } from '../envFile';
import { editableYaml, getYamlPath, readYaml } from '../yamlFile';
import { displayPath, err, forbiddenPlace, manualPlan, mcpUrl, parseMcpUrl, placeholder, protectedError, protectedTarget } from './common';
import { fileEntry, yamlFormat } from './jsonEntry';

export const ENV_VAR = 'MCP_ANYTYPE_API_KEY';
/** The manual alternative when anything is unusual */
export const ALT_NAME = 'anytype_me';
export const ALT_ENV_VAR = 'MCP_ANYTYPE_ME_API_KEY';

/** The Anytype CLI's API ports (the gateway's bot account), as opposed to the desktop app's 31007–31009 */
const CLI_PORTS = [ 31010, 31011, 31012 ];

const INSTRUCTIONS = { reloadServer: 'aiConnectStepHermesReload' };

export const hermesHeader = (name: string): string => `Bearer \${${name}}`;

export const hermesEntry = (port: number, tier: any, name = ENV_VAR) => ({ url: mcpUrl(port, tier), headers: { Authorization: hermesHeader(name) } });

const configOf = (det: Detected): string | null => det.targetPaths[0] || null;

/** The default profile's .env (unresolved: links are resolved by each read and write) */
export const hermesEnvFile = (env: Env): string => pathOf(env).join(hermesHome(env), '.env');

/** The .env file, checked like the config file: resolved under home, outside Anytype's folders, readable */
const loadEnv = (env: Env): { real: string; snapshot: Snapshot } | { error: AiError } => {
	const t = resolveTarget(env, hermesEnvFile(env));

	if ('error' in t) {
		return t;
	};
	if (protectedTarget(env, t.real)) {
		return { error: protectedError(t.real) };
	};

	const snapshot = readSnapshot(env, t.real);

	if ('error' in snapshot) {
		return snapshot;
	};
	if (!envUsable(snapshot.text, ENV_VAR)) {
		return { error: err('parse', 'unsupportedForm', t.real) };
	};
	return { real: t.real, snapshot };
};

const readText = (env: Env, file: string | null): string | null => {
	const t = file ? resolveTarget(env, file) : null;
	const snap = (t && !('error' in t)) ? readSnapshot(env, t.real) : null;

	return (snap && !('error' in snap)) ? snap.text : null;
};

/** An `anytype` entry the anytype-hermes gateway would write: the Anytype CLI's port, or a command (stdio) */
export const gatewayEntry = (value: any): boolean => {
	if (!value || (typeof value != 'object')) {
		return false;
	};

	const port = Number((/^https?:\/\/[^/:]+:(\d+)/.exec(String(value.url || '')) || [])[1] || 0);
	return !!value.command || CLI_PORTS.includes(port);
};

/** config.yaml mentions the variable outside `mcp_servers.anytype` (another server would get our key) */
export const variableUsedElsewhere = (configText: string | null): boolean => {
	const doc = readYaml(configText);

	if (!('value' in doc)) {
		return true;
	};

	const value = (doc.value && (typeof doc.value == 'object')) ? JSON.parse(JSON.stringify(doc.value)) : doc.value;

	if (value?.mcp_servers && (typeof value.mcp_servers == 'object')) {
		delete value.mcp_servers.anytype;
	};
	return JSON.stringify(value ?? null).includes(ENV_VAR);
};

/** The .env value is free (absent) or the record's own key (rotation) */
const variableFree = (envText: string | null, rec: AiRecord | null): boolean => {
	const value = readEnvVar(envText, ENV_VAR);
	return !value || (!!rec?.keyFp && (keyFingerprint(value) == rec.keyFp));
};

const FORMAT = yamlFormat([ 'mcp_servers', 'anytype' ]);

const engine = (env: Env) => fileEntry({
	// Every snapshot the writer edits (its retry included) is re-checked for another use of the variable (J3)
	format: { ...FORMAT, set: (text, entry) => variableUsedElsewhere(text) ? { ok: false, category: 'unsupportedForm' } : FORMAT.set(text, entry) },
	entry: (port, tier) => hermesEntry(port, tier),
	address: v => parseMcpUrl(v?.url),
	keyOf: v => {
		const e = (v?.headers?.Authorization == hermesHeader(ENV_VAR)) ? loadEnv(env) : null;
		return (e && !('error' in e)) ? readEnvVar(e.snapshot.text, ENV_VAR) : null;
	},
	nextStep: 'reloadServer',
	sentenceKey: 'aiConnectPlanConfigMcpReload',
});

/** Manual steps: the key line in .env first, then the entry in config.yaml */
export const hermesSteps = (env: Env, configFile: string, port: number, tier: any, name = 'anytype', variable = ENV_VAR): AiStep[] => {
	const envFile = hermesEnvFile(env);

	return [
		{ textKey: 'aiConnectManualOpen', args: [ displayPath(env, envFile) ], path: envFile },
		{ textKey: 'aiConnectManualHermesEnv', snippet: `${variable}=${placeholder}`, lang: 'text' },
		...yamlFormat([ 'mcp_servers', name ]).steps(env, configFile, hermesEntry(port, tier, variable), null),
		{ textKey: 'aiConnectManualHermesProfile' },
	];
};

/** Why Connect can't write here (null: it can): the .env place, the variable, a config that isn't lossless */
const blocker = (ctx: Ctx, configFile: string, rec: AiRecord | null): { error: AiError; note?: string } | null => {
	const e = loadEnv(ctx.env);

	if ('error' in e) {
		return { error: e.error };
	};

	const config = readText(ctx.env, configFile);
	const ready = editableYaml(config);

	if ('category' in ready) {
		return { error: err('parse', ready.category, configFile) };
	};
	if (!variableFree(e.snapshot.text, rec) || variableUsedElsewhere(config)) {
		return { error: err('validate', 'conflict', e.real), note: 'aiConnectHermesVariable' };
	};
	return null;
};

/** Writes our key line; every attempt re-checks that the variable is still free or ours */
const writeKey = async (ctx: Ctx, rec: AiRecord | null, key: string, configFile: string): Promise<{ ok: true; previous: string | null; real: string; createdDirs: string[] } | { ok: false; error: AiError }> => {
	for (let attempt = 0; attempt < 2; attempt++) {
		const e = loadEnv(ctx.env);

		if ('error' in e) {
			return { ok: false, error: e.error };
		};
		if (!variableFree(e.snapshot.text, rec) || variableUsedElsewhere(readText(ctx.env, configFile))) {
			return { ok: false, error: err('validate', 'conflict', e.real) };
		};

		const edit = setEnvVar(e.snapshot.text, ENV_VAR, key);

		if (!edit.ok) {
			return { ok: false, error: err('parse', 'unsupportedForm', e.real) };
		};

		const res = await writeFileSafe(ctx.env, e.real, edit.text, { snapshot: e.snapshot, secret: true, backup: false });

		if ('createdDirs' in res) {
			return { ok: true, previous: readEnvVar(e.snapshot.text, ENV_VAR), real: e.real, createdDirs: res.createdDirs };
		};
		if ('error' in res) {
			return { ok: false, error: res.error };
		};
	};
	return { ok: false, error: err('write', 'changed', hermesEnvFile(ctx.env)) };
};

/** The new key is no longer what the profile's .env binds (null: it can't be told) */
const unbound = (ctx: Ctx, key: string): boolean | null => {
	const e = loadEnv(ctx.env);

	if ('error' in e) {
		return null;
	};

	const value = readEnvVar(e.snapshot.text, ENV_VAR);
	return !value || (keyFingerprint(value) != keyFingerprint(key));
};

/**
 * Undoes only our line on the latest file: the previous value back, or our line removed (still ours only); a changed
 * file is re-read once. true only when a re-read shows the new key is no longer bound (J1)
 */
const restoreKey = async (ctx: Ctx, previous: string | null, key: string): Promise<boolean> => {
	for (let attempt = 0; attempt < 2; attempt++) {
		const e = loadEnv(ctx.env);

		if ('error' in e) {
			return false;
		};
		if (unbound(ctx, key)) {
			return true;
		};

		const edit = (previous === null) ? removeEnvVar(e.snapshot.text, ENV_VAR) : setEnvVar(e.snapshot.text, ENV_VAR, previous);

		if (!edit.ok) {
			return false;
		};

		const res = await writeFileSafe(ctx.env, e.real, edit.text, { snapshot: e.snapshot, secret: true, backup: false });

		if ('error' in res) {
			return false;
		};
	};
	return unbound(ctx, key) === true;
};

/** Removes our key line while it holds the record's key; a changed file is re-read once. false: it stayed */
const removeKey = async (ctx: Ctx, rec: AiRecord): Promise<boolean> => {
	for (let attempt = 0; attempt < 2; attempt++) {
		const e = loadEnv(ctx.env);

		if ('error' in e) {
			return (e.error.category == 'notFound');
		};

		const value = readEnvVar(e.snapshot.text, ENV_VAR);

		if (!value || !rec.keyFp || (keyFingerprint(value) != rec.keyFp)) {
			return true;
		};

		const edit = removeEnvVar(e.snapshot.text, ENV_VAR);

		if (!edit.ok) {
			return false;
		};

		const res = await writeFileSafe(ctx.env, e.real, edit.text, { snapshot: e.snapshot, secret: true, backup: false });

		if ('createdDirs' in res) {
			return true;
		};
		if ('error' in res) {
			return false;
		};
	};
	return false;
};

export const hermes: Adapter = {
	ids: [ 'hermes' ],
	target: (env, det) => (det.targetId && configOf(det)) ? { targetId: det.targetId, path: configOf(det) } : null,
	plan: async (ctx, det, rec): Promise<AiPlan> => {
		const file = configOf(det);
		const plan = engine(ctx.env).plan(ctx, file, rec);
		const ret: AiPlan = { ...plan, instructions: INSTRUCTIONS };

		if (!file) {
			return ret;
		};

		const envPlace = loadEnv(ctx.env);
		const config = readText(ctx.env, file);
		const value = getYamlPath(config, [ 'mcp_servers', 'anytype' ]);

		// A forbidden place for the key, or a path that doesn't resolve (a link to a missing file, J4): no key-bearing steps
		const envTarget = resolveTarget(ctx.env, hermesEnvFile(ctx.env));

		if ('error' in envTarget) {
			return manualPlan(ret, envTarget.error, []);
		};
		if (('error' in envPlace) && forbiddenPlace(envPlace.error)) {
			return manualPlan(ret, envPlace.error, []);
		};
		if ((plan.existing == 'foreign') || ((value !== undefined) && (plan.existing != 'ours'))) {
			const manual = manualPlan(ret, err('validate', 'conflict', plan.targetPath), hermesSteps(ctx.env, file, ctx.port, ctx.tier, ALT_NAME, ALT_ENV_VAR));

			delete manual.replace;
			return { ...manual, note: gatewayEntry(value) ? 'aiConnectHermesGateway' : 'aiConnectHermesForeign' };
		};

		const blocked = blocker(ctx, file, rec);

		if (blocked || !plan.canApply) {
			// Anything unusual: the entry under anytype_me, by hand (never a guess about the `anytype` slot)
			const manual = manualPlan(ret, blocked?.error || plan.error, hermesSteps(ctx.env, file, ctx.port, ctx.tier, ALT_NAME, ALT_ENV_VAR));

			delete manual.replace;
			return blocked?.note ? { ...manual, note: blocked.note } : manual;
		};
		return { ...ret, steps: hermesSteps(ctx.env, file, ctx.port, ctx.tier) };
	},
	apply: async (ctx, det, rec): Promise<ApplyOutcome> => {
		const file = configOf(det);

		if (!file) {
			return { ok: false, error: err('detect', 'notFound') };
		};

		const writer = engine(ctx.env);
		const pre = writer.plan(ctx, file, rec);

		if (pre.existing == 'foreign') {
			return { ok: false, error: err('validate', 'conflict', pre.targetPath) };
		};

		const blocked = blocker(ctx, file, rec);

		if (blocked) {
			return { ok: false, error: blocked.error };
		};
		if (!pre.canApply) {
			return { ok: false, error: pre.error };
		};

		// The key first, then the entry
		const key = await writeKey(ctx, rec, ctx.key, file);

		if ('error' in key) {
			return { ok: false, error: key.error };
		};

		// Our entry now reads the new key: it is ours under the new fingerprint
		const fp = keyFingerprint(ctx.key);
		const owner = (pre.existing == 'ours') ? { ...rec, keyFp: fp } : rec;
		const res = await writer.apply(ctx, file, owner);

		if (!res.ok) {
			if (await restoreKey(ctx, key.previous, ctx.key)) {
				return res;
			};
			// The new key may be what Hermes reads now (the rollback failed): kept as a candidate, never revoked here (J1)
			return { ok: true, unconfirmed: true, running: false, method: 'config', nextStep: 'reloadServer', targetPath: pre.targetPath, observedInstalled: false, createdDirs: key.createdDirs };
		};

		// Installed means the entry AND the binding: the .env still holds this key
		const now = loadEnv(ctx.env);
		const bound = !('error' in now) && (readEnvVar(now.snapshot.text, ENV_VAR) !== null) && (keyFingerprint(readEnvVar(now.snapshot.text, ENV_VAR)) == fp);

		return { ...res, observedInstalled: !!res.observedInstalled && bound, createdDirs: [ ...key.createdDirs, ...(res.createdDirs || []) ] };
	},
	remove: async (ctx, rec) => {
		const res = await engine(ctx.env).remove(ctx, rec);

		if (!res.ok) {
			return res;
		};
		// The entry is gone; a key line that stays is reported (revocation proceeds)
		return (await removeKey(ctx, rec)) ? res : { ...res, left: 'envKey' as const };
	},
	check: (ctx, rec) => engine(ctx.env).check(ctx, rec),
	update: (ctx, rec, change) => engine(ctx.env).update(ctx, rec, change),
	// An unreadable binding can't tell which key Hermes uses: settlement waits (J1)
	installedFp: async (ctx, rec) => ('error' in loadEnv(ctx.env)) ? 'unreadable' : engine(ctx.env).installedFp(ctx, rec),
	canRestart: () => false,
};
