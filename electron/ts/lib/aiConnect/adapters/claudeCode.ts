/**
 * Claude Code (targetId `claude-code`). Two routes:
 *
 * - `skill` (default, provisional): Anytype's marked `anytype-api` skill in <profile>/skills and the key
 *   in <profile>/settings.json `env` (ANYTYPE_API_URL, ANYTYPE_API_KEY). A user's own unmarked skill is
 *   never overwritten or deleted. Sandbox on (any platform) → the plan switches to `http`.
 *   Everything done for a record is bound to the profile the record was made in (its settings file and
 *   the skill next to it): while Claude Code resolves another profile, nothing is refreshed, healed or
 *   copied over (check → reconnect, update → conflict). The profile must still be the real directory it
 *   was (no link swapped in), and settings.json must sit in it (a settings.json linked elsewhere → manual,
 *   the skill's place would be ambiguous). Skill cleanup deletes only inside that profile's own
 *   `skills/anytype-api`, never through a link, and only the file it read. A user's own SKILL.md, or env
 *   values Anytype didn't write (the URL alone counts), are never overwritten.
 * - `http` (MCP tools): writes only through the `claude` CLI (`mcp add-json … -`, JSON on stdin; never
 *   the key in argv); Claude's own config file is only ever read. Preflight, the CLI and the readback use
 *   the same verified file: the CLI gets the canonical CLAUDE_CONFIG_DIR that was checked, and the
 *   mapping is checked again right before each writing call. Ownership = the key fingerprint AND exactly
 *   the entry Anytype hands the CLI for some port and tier. The readback is the verification (no
 *   `mcp get`: it contacts whatever server the name resolves to). After a failed CLI call the file decides
 *   what is reported (old entry still there, removed, or the new one installed); an end that couldn't be
 *   confirmed (`running`) or a readback that can't be read is `unconfirmed`. Removal runs the CLI against
 *   the record's own profile file. Passive checks never run the CLI. Without a CLI that reads stdin the
 *   manual steps are only "install / update Claude Code" (nothing to paste into).
 * A route or profile change leaves the previous one's artefacts behind: `separateRoutes`, the service
 * removes them with the previous record.
 */
import type { Adapter, AiError, AiPlan, AiRecord, AiRoute, AiStep, ApplyOutcome, CheckOutcome, Ctx, Detected, Env, Homes } from '../types';
import {
	canonicalPath, dirsWritable, ensureDirs, isInside, pathOf, readSnapshot, realHome, removeCreatedDirs, resolveTarget, unchangedSince, writeFileSafe, type Snapshot,
} from '../fsSafe';
import { getJsonPath, mutationOnly, readJson, removeJsonPath, setIn, setJsonPath } from '../jsonFile';
import { canonicalDigest, keyFingerprint } from '../digest';
import { claudeCodeProfile } from '../detect';
import { isRunnableCli, runCli } from '../exec';
import { buildFromDist, hasMarker } from '../skill';
import {
	apiUrl, basePlan, bearer, displayPath, err, forbiddenPlace, goneError, keyOfBearer, looseFile, manualPlan, mayWrite, mcpUrl, mergeStep, parseApiUrl, parseMcpUrl, placeholder,
	protectedError, protectedTarget, stillLive, type WriteMode,
} from './common';

/** `claude mcp add-json … -` reads stdin from this version on */
export const MIN_CLI_VERSION = [ 2, 1, 327 ];

const ENV_URL = [ 'env', 'ANYTYPE_API_URL' ];
const ENV_KEY = [ 'env', 'ANYTYPE_API_KEY' ];

const INSTRUCTIONS = { newSession: 'aiConnectStepNewSession' };

const join = (env: Env, ...parts: string[]): string => pathOf(env).join(...parts);

const samePath = (env: Env, a: string | null, b: string | null): boolean => !!a && !!b && ((env.platform == 'win32') ? (a.toLowerCase() == b.toLowerCase()) : (a == b));

/** The settings file of the profile Claude Code resolves now ('' when CLAUDE_CONFIG_DIR is rejected) */
const settingsFile = (env: Env, homes: Homes): string => homes.claudeHome ? join(env, homes.claudeHome, 'settings.json') : '';

/** A profile's skill: next to its settings file (never "wherever the home resolves today") */
const skillFileOf = (env: Env, settings: string): string => join(env, pathOf(env).dirname(settings), 'skills', 'anytype-api', 'SKILL.md');

const present = (v: any): boolean => (v !== undefined) && (v !== null);

// ---------------------- reading ---------------------- //

interface Loaded {
	real: string;
	snapshot: Snapshot;
	doc: any;
};

const loadJson = (env: Env, file: string): Loaded | { error: AiError } => {
	const target = resolveTarget(env, file);

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

	const doc = readJson(snapshot.text);

	if (!('value' in doc)) {
		return { error: err('parse', 'unparseable', target.real) };
	};
	return { real: target.real, snapshot, doc: doc.value };
};

/** `sandbox.enabled === true` in settings.json (an unreadable file counts as off; the skill route then fails on it) */
export const sandboxOn = (env: Env, homes: Homes): boolean => {
	const file = settingsFile(env, homes);
	const t = file ? loadJson(env, file) : null;

	return !!t && ('doc' in t) && (getJsonPath(t.snapshot.text, [ 'sandbox', 'enabled' ]) === true);
};

/** The route this request really takes: skill + sandbox on → http with the note */
const effectiveRoute = (ctx: Ctx): { route: AiRoute; note?: string } => ((ctx.route == 'skill') && sandboxOn(ctx.env, ctx.homes)) ? { route: 'http', note: 'aiConnectNoteSandbox' } : { route: ctx.route };

// ---------------------- skill route ---------------------- //

/** The key in settings.json env, and whether both values are exactly what Anytype writes */
const skillValues = (text: string | null): { url: any; key: any; owned: { port: number; key: string; fp: string } | null } => {
	const url = getJsonPath(text, ENV_URL);
	const key = getJsonPath(text, ENV_KEY);
	const port = parseApiUrl(url);
	const valid = (typeof key == 'string') && /^[\x21-\x7E]+$/.test(key);

	return { url, key, owned: (port && valid) ? { port, key, fp: keyFingerprint(key) } : null };
};

const skillOwned = (values: ReturnType<typeof skillValues>, rec: AiRecord | null): boolean => !!values.owned && !!rec?.keyFp && (values.owned.fp == rec.keyFp);

const skillDigest = (values: ReturnType<typeof skillValues>): string => canonicalDigest({ url: values.url ?? null, key: values.key });

/** The record's profile is the one Claude Code resolves now */
const sameSkillProfile = (ctx: Ctx, rec: AiRecord): boolean => {
	const file = settingsFile(ctx.env, ctx.homes);
	return samePath(ctx.env, file ? canonicalPath(ctx.env, file) : null, rec.targetPath);
};

/** A real directory that is its own canonical path (no link swapped in) */
const realDir = (env: Env, dir: string): boolean => {
	const st = env.lstat(dir);
	return !!st && !st.isSymlink && st.isDir && samePath(env, env.realpath(dir), dir);
};

/**
 * The record's profile is still what it was: its directory a real directory at its own canonical path,
 * its settings file still resolving to itself. A link swapped in since → nothing is touched there.
 */
const profileIntact = (env: Env, rec: AiRecord): boolean => realDir(env, pathOf(env).dirname(rec.targetPath)) && samePath(env, canonicalPath(env, rec.targetPath), rec.targetPath);

/**
 * settings.json lies in its profile directory (canonical profile + `settings.json`). A settings.json linked
 * elsewhere (dotfiles) is not supported automatically: the skill belongs to the profile, the settings to
 * the link's target, and Anytype keeps one path per record.
 */
const settingsInProfile = (env: Env, homes: Homes, real: string): boolean => {
	const dir = homes.claudeHome ? canonicalPath(env, homes.claudeHome) : null;
	return !!dir && samePath(env, pathOf(env).join(dir, 'settings.json'), real);
};

/** Manual: open settings.json, merge the env values, save the skill file */
const skillSteps = (ctx: Ctx, file: string): AiStep[] => {
	const built = buildFromDist(ctx.env);
	const skill = file ? skillFileOf(ctx.env, file) : '';
	const steps: AiStep[] = [
		{ textKey: 'aiConnectManualOpen', args: [ displayPath(ctx.env, file) ], path: file },
		mergeStep({ env: { ANYTYPE_API_URL: apiUrl(ctx.port), ANYTYPE_API_KEY: placeholder } }),
	];

	if (built && skill) {
		steps.push({ textKey: 'aiConnectManualSaveFile', args: [ displayPath(ctx.env, skill) ], snippet: built, lang: 'text', path: skill });
	};
	return steps;
};

/** Both env values set, guarded so nothing else in the file changes */
const setSkillEnv = (text: string | null, url: string, key: string): { ok: true; text: string } | { ok: false; category: 'unparseable' | 'unsupportedForm' } => {
	const a = setJsonPath(text, ENV_URL, url);

	if (!('text' in a)) {
		return a;
	};

	const b = setJsonPath(a.text, ENV_KEY, key);

	if (!('text' in b)) {
		return b;
	};

	const guarded = mutationOnly(text, b.text, doc => {
		setIn(doc, ENV_URL, url);
		setIn(doc, ENV_KEY, key);
	});

	return guarded ? b : { ok: false, category: 'unparseable' };
};

const removeSkillEnv = (text: string | null): { ok: true; text: string } | { ok: false; category: 'unparseable' | 'unsupportedForm' } => {
	const a = removeJsonPath(text, ENV_URL);

	if (!('text' in a)) {
		return a;
	};

	const b = removeJsonPath(a.text, ENV_KEY);

	if (!('text' in b)) {
		return b;
	};

	const guarded = mutationOnly(text, b.text, doc => {
		setIn(doc, ENV_URL, undefined);
		setIn(doc, ENV_KEY, undefined);
	});

	return guarded ? b : { ok: false, category: 'unparseable' };
};

/** The skill file as it is: the user's own (unmarked), ours (marked), none, or an error reading it */
const skillState = (env: Env, file: string): 'user' | 'ours' | 'none' | { error: AiError } => {
	const snap = readSnapshot(env, file);

	if ('error' in snap) {
		return snap;
	};
	if (snap.text === null) {
		return 'none';
	};
	return hasMarker(snap.text) ? 'ours' : 'user';
};

/**
 * Writes or refreshes the marked skill at `file`; `created`: this call made the file. A fresh profile
 * gets its `skills` directory first (at most two levels), then the skill's own one with the file. The
 * snapshot whose marker was checked is the one the atomic write rechecks: a file the user created,
 * replaced or deleted in between → re-plan once (ownership checked again), then `changed`.
 * `owned` (a refresh): only an existing marked file is rewritten, a deleted one is never put back.
 */
const writeSkill = async (env: Env, file: string, mode: WriteMode): Promise<{ ok: true; created: boolean; createdDirs: string[]; real: string } | { ok: false; error: AiError }> => {
	const P = pathOf(env);
	const text = buildFromDist(env);
	const target = resolveTarget(env, file);

	if (!text) {
		return { ok: false, error: err('verify', 'notFound') };
	};
	if ('error' in target) {
		return { ok: false, error: target.error };
	};
	if (protectedTarget(env, target.real)) {
		return { ok: false, error: protectedError(target.real) };
	};

	let created: string[] = [];
	let wasPresent = false;

	for (let attempt = 0; attempt < 2; attempt++) {
		const snapshot = readSnapshot(env, target.real);

		if ('error' in snapshot) {
			removeCreatedDirs(env, created);
			return { ok: false, error: snapshot.error };
		};
		if (!attempt) {
			wasPresent = snapshot.text !== null;
		};
		if ((snapshot.text !== null) && !hasMarker(snapshot.text)) {
			removeCreatedDirs(env, created);
			return { ok: false, error: err('validate', 'conflict', target.real) };
		};
		if ((snapshot.text === null) && ((mode == 'owned') || wasPresent)) {
			removeCreatedDirs(env, created);
			return { ok: false, error: goneError(mode, target.real) };
		};
		if (snapshot.text === text) {
			return { ok: true, created: false, createdDirs: created, real: target.real };
		};

		if (!attempt) {
			const dirs = ensureDirs(env, P.dirname(P.dirname(target.real)));

			if ('error' in dirs) {
				return { ok: false, error: dirs.error };
			};
			if ('changed' in dirs) {
				return { ok: false, error: err('write', 'changed', target.real) };
			};
			created = dirs.created;
		};

		const res = await writeFileSafe(env, target.real, text, { snapshot, secret: false });

		if ('createdDirs' in res) {
			return { ok: true, created: snapshot.text === null, createdDirs: [ ...created, ...res.createdDirs ], real: target.real };
		};
		if ('error' in res) {
			removeCreatedDirs(env, created);
			return { ok: false, error: res.error };
		};
	};

	removeCreatedDirs(env, created);
	return { ok: false, error: err('write', 'changed', target.real) };
};

/**
 * Deletes Anytype's skill (marked only) from the profile of `settings`, then its directory when empty.
 * Confined: the profile is inside home, `skills` and `anytype-api` are real directories (no link on the
 * way), the file is a regular file at its own canonical path and still the one read. `left`: there, but
 * it couldn't be verified (left alone); `none`: nothing of ours there.
 */
const removeSkill = (env: Env, settings: string): 'none' | 'removed' | 'left' => {
	const P = pathOf(env);
	const profile = P.dirname(settings);

	// The record's own profile directory, still the real directory it was (a link swapped in → left alone)
	if (!env.lstat(profile)) {
		return 'none';
	};
	if (!realDir(env, profile) || !isInside(env, realHome(env), profile)) {
		return 'left';
	};

	const skills = P.join(profile, 'skills');
	const dir = P.join(skills, 'anytype-api');
	const file = P.join(dir, 'SKILL.md');

	for (const p of [ skills, dir ]) {
		const st = env.lstat(p);

		if (!st) {
			return 'none';
		};
		if (st.isSymlink || !st.isDir) {
			return 'left';
		};
	};

	const st = env.lstat(file);

	if (!st) {
		return 'none';
	};
	if (st.isSymlink || !st.isFile || !samePath(env, env.realpath(file), file)) {
		return 'left';
	};

	const snap = readSnapshot(env, file);

	if ('error' in snap) {
		return 'left';
	};
	// The user's own skill is never deleted
	if ((snap.text === null) || !hasMarker(snap.text)) {
		return 'none';
	};
	if (!unchangedSince(env, file, snap)) {
		return 'left';
	};

	try {
		env.unlink(file);
	} catch (e) {
		return 'left';
	};
	try {
		env.rmdir(dir);
	} catch (e) { /* not empty */ };
	return 'removed';
};

/**
 * settings.json at `file` with the env values written when the precondition of `mode` holds on this
 * attempt (common.mayWrite); one re-plan on `changed`
 */
const writeSkillEnv = async (ctx: Ctx, file: string, rec: AiRecord | null, url: string, key: string, mode: WriteMode): Promise<{ ok: true; real: string; createdDirs: string[] } | { ok: false; error: AiError; gone?: boolean }> => {
	let wasPresent = false;

	for (let attempt = 0; attempt < 2; attempt++) {
		const t = loadJson(ctx.env, file);

		if ('error' in t) {
			return { ok: false, error: t.error };
		};

		const values = skillValues(t.snapshot.text);
		// Either value counts: Anytype writes both, so a URL alone is someone's too
		const here = present(values.key) || present(values.url);

		if (!attempt) {
			wasPresent = here;
		};

		const consent = here && !!ctx.replace && (ctx.replace.targetPath == t.real) && (ctx.replace.foreignDigest == skillDigest(values));
		const verdict = mayWrite({ mode, present: here, owned: skillOwned(values, rec), consent, consentHere: ctx.replace?.targetPath == t.real, wasPresent });

		if (verdict == 'conflict') {
			return { ok: false, error: err('validate', 'conflict', t.real) };
		};
		if (verdict == 'gone') {
			return { ok: false, gone: true, error: goneError(mode, t.real) };
		};

		const edit = setSkillEnv(t.snapshot.text, url, key);

		if (!('text' in edit)) {
			return { ok: false, error: err('parse', edit.category, t.real) };
		};

		const res = await writeFileSafe(ctx.env, t.real, edit.text, { snapshot: t.snapshot, secret: true });

		if ('createdDirs' in res) {
			return { ok: true, real: t.real, createdDirs: res.createdDirs };
		};
		if ('error' in res) {
			return { ok: false, error: res.error };
		};
	};
	return { ok: false, error: err('write', 'changed') };
};

const skillRoute = {
	plan: (ctx: Ctx, rec: AiRecord | null, base: AiPlan): AiPlan => {
		const P = pathOf(ctx.env);
		const file = settingsFile(ctx.env, ctx.homes);
		const plan: AiPlan = { ...base, method: 'config', nextStep: 'newSession', sentenceKey: 'aiConnectPlanSkill', steps: skillSteps(ctx, file) };
		const t = loadJson(ctx.env, file);

		if ('error' in t) {
			return manualPlan(plan, t.error, forbiddenPlace(t.error) ? [] : plan.steps);
		};

		if (!settingsInProfile(ctx.env, ctx.homes, t.real)) {
			return manualPlan(plan, err('read', 'unsupportedForm', t.real), plan.steps);
		};

		const skill = skillFileOf(ctx.env, t.real);
		const state = skillState(ctx.env, skill);

		if (typeof state != 'string') {
			return manualPlan(plan, state.error, plan.steps);
		};
		// The user's own skill: never replaced, not even by hand on Anytype's say-so (the form offers MCP tools)
		if (state == 'user') {
			return { ...manualPlan(plan, err('validate', 'conflict', skill), []), note: 'aiConnectSkillConflict' };
		};

		// What the writer needs: the built skill, a skills directory it may create, settings it may write, an env edit it can make
		if (!buildFromDist(ctx.env)) {
			return manualPlan(plan, err('verify', 'notFound'), plan.steps);
		};

		const dirs = dirsWritable(ctx.env, P.dirname(skill)) || dirsWritable(ctx.env, t.real);

		if (dirs) {
			return manualPlan(plan, dirs, plan.steps);
		};

		const dry = setSkillEnv(t.snapshot.text, apiUrl(ctx.port), placeholder);

		if (!('text' in dry)) {
			return manualPlan(plan, err('parse', dry.category, t.real), plan.steps);
		};

		const values = skillValues(t.snapshot.text);

		plan.displayTarget = displayPath(ctx.env, t.real);
		plan.targetPath = t.real;
		if (present(values.key) || present(values.url)) {
			if (skillOwned(values, rec)) {
				plan.existing = 'ours';
			} else {
				plan.existing = 'foreign';
				plan.replace = { targetPath: t.real, foreignDigest: skillDigest(values) };
			};
		};
		return plan;
	},

	apply: async (ctx: Ctx, rec: AiRecord | null): Promise<ApplyOutcome> => {
		const target = resolveTarget(ctx.env, settingsFile(ctx.env, ctx.homes));

		if ('error' in target) {
			return { ok: false, error: target.error };
		};
		if (!settingsInProfile(ctx.env, ctx.homes, target.real)) {
			return { ok: false, error: err('read', 'unsupportedForm', target.real) };
		};

		const skill = await writeSkill(ctx.env, skillFileOf(ctx.env, target.real), 'install');

		if ('error' in skill) {
			return { ok: false, error: skill.error };
		};

		// Commit: the key goes into settings.json
		const res = await writeSkillEnv(ctx, target.real, rec, apiUrl(ctx.port), ctx.key, 'install');

		if ('error' in res) {
			if (skill.created) {
				removeSkill(ctx.env, target.real);
			};
			removeCreatedDirs(ctx.env, skill.createdDirs);
			return { ok: false, error: res.error };
		};

		return { ok: true, method: 'config', route: 'skill', nextStep: 'newSession', targetPath: res.real, observedInstalled: true, createdDirs: [ ...skill.createdDirs, ...res.createdDirs ] };
	},

	/** Bound to the record's profile, whatever Claude Code resolves now */
	remove: async (ctx: Ctx, rec: AiRecord): Promise<{ ok: boolean; left?: 'entry'; error?: AiError }> => {
		const cleanSkill = (): { ok: true; left?: 'entry' } => (removeSkill(ctx.env, rec.targetPath) == 'left') ? { ok: true, left: 'entry' } : { ok: true };

		// The profile isn't what it was (a link swapped in): another profile's files are never touched
		if (ctx.env.lstat(pathOf(ctx.env).dirname(rec.targetPath)) && !profileIntact(ctx.env, rec)) {
			return { ok: false, left: 'entry', error: err('read', 'changed', rec.targetPath) };
		};

		for (let attempt = 0; attempt < 2; attempt++) {
			const t = loadJson(ctx.env, rec.targetPath);

			if ('error' in t) {
				return (t.error.category == 'notFound') ? cleanSkill() : { ok: false, left: 'entry', error: t.error };
			};

			const values = skillValues(t.snapshot.text);

			if (!present(values.key) && !present(values.url)) {
				return cleanSkill();
			};
			if (!skillOwned(values, rec)) {
				return { ok: false, error: err('validate', 'conflict', t.real) };
			};

			const edit = removeSkillEnv(t.snapshot.text);

			if (!('text' in edit)) {
				return { ok: false, left: 'entry', error: err('parse', edit.category, t.real) };
			};

			const res = await writeFileSafe(ctx.env, t.real, edit.text, { snapshot: t.snapshot, secret: true });

			if ('createdDirs' in res) {
				return cleanSkill();
			};
			if ('error' in res) {
				return { ok: false, left: 'entry', error: res.error };
			};
		};
		return { ok: false, left: 'entry', error: err('write', 'changed', rec.targetPath) };
	},

	check: async (ctx: Ctx, rec: AiRecord): Promise<CheckOutcome> => {
		const t = loadJson(ctx.env, rec.targetPath);

		if ('error' in t) {
			return (t.error.category == 'notFound') ? { status: rec.observedInstalled ? 'removed' : 'pending' } : { status: 'unreadable' };
		};

		const values = skillValues(t.snapshot.text);

		if (!present(values.key)) {
			return { status: rec.observedInstalled ? 'removed' : 'pending' };
		};
		if (!skillOwned(values, rec)) {
			return { status: 'conflict' };
		};

		const skill = skillFileOf(ctx.env, rec.targetPath);
		const snap = readSnapshot(ctx.env, skill);

		if ('error' in snap) {
			return { status: 'unreadable' };
		};
		// The skill was removed in Claude Code: never re-added
		if (snap.text === null) {
			return { status: 'removed', observedInstalled: true };
		};
		// The user replaced it with their own: theirs, not a healthy connection
		if (!hasMarker(snap.text)) {
			return { status: 'conflict', observedInstalled: true };
		};
		// Claude Code reads another profile now (or a link was swapped in): nothing is refreshed or healed, nothing copied over
		if (!sameSkillProfile(ctx, rec) || !profileIntact(ctx.env, rec)) {
			return { status: 'reconnect', observedInstalled: true };
		};
		// Ours but from another build: refreshed; a refresh that fails needs attention
		if (snap.text !== buildFromDist(ctx.env)) {
			const refreshed = await writeSkill(ctx.env, skill, 'owned');

			if ('error' in refreshed) {
				const category = refreshed.error.category;
				return { status: (category == 'notFound') ? 'removed' : ((category == 'conflict') ? 'conflict' : 'reconnect'), observedInstalled: true };
			};
		};

		if (ctx.port && (values.owned.port != ctx.port)) {
			// A key from a file others can write is not written back anywhere
			if (looseFile(ctx.env, t.snapshot.mode)) {
				return { status: 'reconnect', observedInstalled: true };
			};

			// The API stopped meanwhile: no heal (the service keeps the last status, B2)
			if (!stillLive(ctx)) {
				return { status: 'pending' };
			};

			const res = await writeSkillEnv(ctx, rec.targetPath, rec, apiUrl(ctx.port), values.owned.key, 'owned');

			if (res.ok) {
				return { status: 'ok', healed: true, nextStep: 'newSession', observedInstalled: true };
			};
			return { status: ('gone' in res) ? 'removed' : 'reconnect', observedInstalled: true };
		};
		return { status: 'ok', observedInstalled: true };
	},

	update: async (ctx: Ctx, rec: AiRecord, change: { port?: number }): Promise<{ ok: boolean; nextStep?: 'newSession'; error?: AiError }> => {
		// Another profile is current (or a link was swapped in): the record's key is never written into it
		if (!sameSkillProfile(ctx, rec) || !profileIntact(ctx.env, rec)) {
			return { ok: false, error: err('validate', 'conflict', rec.targetPath) };
		};

		const t = loadJson(ctx.env, rec.targetPath);

		if ('error' in t) {
			return { ok: false, error: t.error };
		};

		const values = skillValues(t.snapshot.text);

		if (!skillOwned(values, rec)) {
			return { ok: false, error: err('validate', present(values.key) ? 'conflict' : 'notFound', t.real) };
		};
		if (looseFile(ctx.env, t.snapshot.mode)) {
			return { ok: false, error: err('read', 'permission', t.real) };
		};

		const res = await writeSkillEnv(ctx, rec.targetPath, rec, apiUrl(change.port || rec.port), values.owned.key, 'owned');
		return ('error' in res) ? { ok: false, error: res.error } : { ok: true, nextStep: 'newSession' };
	},

	installedFp: async (ctx: Ctx, rec: AiRecord): Promise<string | null | 'unreadable'> => {
		const t = loadJson(ctx.env, rec.targetPath);

		if ('error' in t) {
			return (t.error.category == 'notFound') ? null : 'unreadable';
		};

		const values = skillValues(t.snapshot.text);
		return values.owned ? values.owned.fp : null;
	},
};

// ---------------------- MCP route (the claude CLI) ---------------------- //

/** `claude --version` → [ major, minor, patch ], or null */
export const parseVersion = (stdout: string): number[] | null => {
	const m = /(\d+)\.(\d+)\.(\d+)/.exec(String(stdout || ''));
	return m ? [ Number(m[1]), Number(m[2]), Number(m[3]) ] : null;
};

const atLeast = (v: number[], min: number[]): boolean => {
	for (let i = 0; i < 3; i++) {
		if (v[i] != min[i]) {
			return v[i] > min[i];
		};
	};
	return true;
};

/** The entry Anytype hands the CLI (on stdin) */
const cliEntry = (port: number, tier: any, key: string) => ({ type: 'http', url: mcpUrl(port, tier), headers: { Authorization: bearer(key) } });

/**
 * The user-scope entry in Claude's config file (read-only for Anytype). `fp`: the key it carries;
 * `owned`: set only when the entry is exactly what Anytype hands the CLI for its port and tier (a changed
 * host, transport or an extra field → null).
 */
type McpEntry = { kind: 'absent' } | { kind: 'unreadable' } | { kind: 'entry'; value: any; fp: string | null; owned: { port: number; tier: string; fp: string } | null };

const readEntry = (env: Env, file: string): McpEntry => {
	const t = loadJson(env, file);

	if ('error' in t) {
		return (t.error.category == 'notFound') ? { kind: 'absent' } : { kind: 'unreadable' };
	};

	const value = getJsonPath(t.snapshot.text, [ 'mcpServers', 'anytype' ]);

	if (!present(value)) {
		return { kind: 'absent' };
	};

	const key = keyOfBearer(value?.headers?.Authorization);
	const address = parseMcpUrl(value?.url);
	const fp = key ? keyFingerprint(key) : null;
	const owned = (key && address && (canonicalDigest(value) == canonicalDigest(cliEntry(address.port, address.tier, key)))) ? { port: address.port, tier: address.tier, fp } : null;

	return { kind: 'entry', value, fp, owned };
};

/** The record owns the entry: its key and exactly the fields Anytype hands the CLI */
const mcpOwned = (entry: McpEntry, rec: AiRecord | null): boolean => (entry.kind == 'entry') && !!entry.owned && !!rec?.keyFp && (entry.owned.fp == rec.keyFp);

/**
 * The profile file the CLI uses, verified, and the homes that pin the CLI to it: CLAUDE_CONFIG_DIR is
 * passed as the canonical directory that was checked, so a link swapped afterwards can't redirect it
 */
const profileFor = (ctx: Ctx): { file: string; homes: Homes } | { error: AiError } => {
	const profile = claudeCodeProfile(ctx.env, ctx.homes);

	if ('error' in profile) {
		return profile;
	};
	if (!ctx.homes.claudeConfigDir) {
		return { file: profile.file, homes: ctx.homes };
	};

	const dir = canonicalPath(ctx.env, ctx.homes.claudeConfigDir);

	if (!dir) {
		return { error: err('detect', 'notFound') };
	};

	const homes: Homes = { ...ctx.homes, claudeConfigDir: dir, claudeHome: dir, overrides: { ...ctx.homes.overrides, CLAUDE_CONFIG_DIR: dir } };
	const pinned = claudeCodeProfile(ctx.env, homes);

	return (!('error' in pinned) && (pinned.file == profile.file)) ? { file: profile.file, homes } : { error: err('detect', 'changed') };
};

/** Right before a CLI call that writes: the profile still resolves to the file that was checked */
const stillSame = (ctx: Ctx, file: string): boolean => {
	const again = profileFor(ctx);
	return !('error' in again) && (again.file == file);
};

/**
 * Homes that make the CLI use exactly `file`, a record's canonical profile file, whatever resolves today:
 * no CLAUDE_CONFIG_DIR for ~/.claude.json, else its directory. null when that doesn't lead back to `file`.
 */
const homesForProfile = (ctx: Ctx, file: string): Homes | null => {
	const P = pathOf(ctx.env);
	const isDefault = samePath(ctx.env, canonicalPath(ctx.env, P.join(ctx.env.home, '.claude.json')), file);
	const dir = isDefault ? '' : P.dirname(file);
	const homes: Homes = {
		...ctx.homes,
		claudeConfigDir: dir,
		claudeHome: dir || P.join(ctx.env.home, '.claude'),
		overrides: { ...ctx.homes.overrides, CLAUDE_CONFIG_DIR: dir },
		rejected: ctx.homes.rejected.filter(v => v != 'CLAUDE_CONFIG_DIR'),
	};
	const profile = claudeCodeProfile(ctx.env, homes);

	return (!('error' in profile) && samePath(ctx.env, profile.file, file)) ? homes : null;
};

/** CLI preflight: a runnable `claude` that is new enough */
const cliReady = async (ctx: Ctx, homes: Homes): Promise<AiError | null> => {
	if (!isRunnableCli(ctx.env, homes.cli.claude)) {
		return err('cli', 'notFound');
	};

	const res = await runCli(ctx.env, homes, 'claude', [ '--version' ], { timeout: 10000 });
	const version = (res.code == 0) ? parseVersion(res.stdout) : null;

	if (!version) {
		return err('cli', 'cliFailed');
	};
	return atLeast(version, MIN_CLI_VERSION) ? null : err('cli', 'cliTooOld');
};

/**
 * Manual: first a keyless command that waits for the entry on stdin, then — only once it waits — the entry
 * to paste (ended with Ctrl-D, Windows Ctrl-Z Enter): the key never goes into argv or shell history.
 * Without a runnable CLI that reads stdin there is nothing to paste into: install / update guidance only.
 */
const mcpSteps = (ctx: Ctx, error?: AiError): AiStep[] => {
	if (error?.category == 'notFound') {
		return [ { textKey: 'aiConnectManualInstallCli', args: [ 'Claude Code', MIN_CLI_VERSION.join('.') ] } ];
	};
	if ((error?.category == 'cliTooOld') || (error?.category == 'cliFailed')) {
		return [ { textKey: 'aiConnectManualUpdateCli', args: [ 'Claude Code', MIN_CLI_VERSION.join('.') ] } ];
	};
	return [
		{ textKey: 'aiConnectManualRun', snippet: 'claude mcp add-json --scope user anytype -', lang: 'sh' },
		{ textKey: (ctx.env.platform == 'win32') ? 'aiConnectManualPasteStdinWin' : 'aiConnectManualPasteStdin', snippet: JSON.stringify(cliEntry(ctx.port, ctx.tier, placeholder)), lang: 'json' },
	];
};

const REMOVE = [ 'mcp', 'remove', 'anytype', '--scope', 'user' ];

const mcpRoute = {
	plan: async (ctx: Ctx, rec: AiRecord | null, base: AiPlan): Promise<AiPlan> => {
		const plan: AiPlan = { ...base, route: 'http', method: 'cli', nextStep: 'newSession', sentenceKey: 'aiConnectPlanCli', steps: mcpSteps(ctx) };
		const pf = profileFor(ctx);

		// Nothing to paste into without a CLI (not run here: the profile alone already rules automatic setup out)
		if ('error' in pf) {
			if (forbiddenPlace(pf.error)) {
				return manualPlan(plan, pf.error, []);
			};
			return manualPlan(plan, pf.error, isRunnableCli(ctx.env, ctx.homes.cli.claude) ? plan.steps : mcpSteps(ctx, err('cli', 'notFound')));
		};

		const cli = await cliReady(ctx, pf.homes);

		if (cli) {
			return manualPlan(plan, cli, mcpSteps(ctx, cli));
		};

		const entry = readEntry(ctx.env, pf.file);

		plan.displayTarget = displayPath(ctx.env, pf.file);
		plan.targetPath = pf.file;
		if (entry.kind == 'unreadable') {
			return manualPlan(plan, err('read', 'unparseable', pf.file), plan.steps);
		};
		if (entry.kind == 'entry') {
			if (mcpOwned(entry, rec)) {
				plan.existing = 'ours';
			} else {
				plan.existing = 'foreign';
				plan.replace = { targetPath: pf.file, foreignDigest: canonicalDigest(entry.value) };
			};
		};
		return plan;
	},

	apply: async (ctx: Ctx, rec: AiRecord | null): Promise<ApplyOutcome> => {
		const pf = profileFor(ctx);

		if ('error' in pf) {
			return { ok: false, error: pf.error };
		};

		const cli = await cliReady(ctx, pf.homes);

		if (cli) {
			return { ok: false, error: cli };
		};

		const file = pf.file;
		const before = readEntry(ctx.env, file);

		if (before.kind == 'unreadable') {
			return { ok: false, error: err('read', 'unparseable', file) };
		};
		if (before.kind == 'entry') {
			const consent = !!ctx.replace && (ctx.replace.targetPath == file) && (ctx.replace.foreignDigest == canonicalDigest(before.value));

			if (!mcpOwned(before, rec) && !consent) {
				return { ok: false, error: err('validate', 'conflict', file) };
			};
		} else
		// The entry the user agreed to replace is gone: the preview no longer holds
		if (ctx.replace?.targetPath == file) {
			return { ok: false, error: err('validate', 'conflict', file) };
		};

		const fp = keyFingerprint(ctx.key);
		const submitted = cliEntry(ctx.port, ctx.tier, ctx.key);
		const outcome = (observed: boolean, unconfirmed?: { running: boolean }): ApplyOutcome => ({
			ok: true, method: 'cli', route: 'http', nextStep: 'newSession', targetPath: file, observedInstalled: observed, createdDirs: [],
			...(unconfirmed ? { unconfirmed: true, running: unconfirmed.running } : {}),
		});
		const failed = (category: 'cliFailed' | 'timeout' | 'changed', removedOld: boolean): ApplyOutcome => ({
			ok: false, error: { stage: (category == 'changed') ? 'write' : 'cli', category, ...(removedOld ? { removedOld: true } : {}) },
		});

		// A first install runs no remove; the new key isn't handed over until the old entry is really gone
		if (before.kind == 'entry') {
			if (!stillSame(ctx, file)) {
				return failed('changed', false);
			};

			const rm = await runCli(ctx.env, pf.homes, 'claude', REMOVE, { timeout: 15000 });
			const now = readEntry(ctx.env, file);

			// A remove that may still land could delete the new entry later: stop here
			if (rm.indeterminate) {
				return failed('timeout', now.kind == 'absent');
			};
			if (now.kind != 'absent') {
				return failed('cliFailed', false);
			};
		};

		if (!stillSame(ctx, file)) {
			return failed('changed', before.kind == 'entry');
		};

		// Commit: the JSON (with the key) only on stdin
		const add = await runCli(ctx.env, pf.homes, 'claude', [ 'mcp', 'add-json', '--scope', 'user', 'anytype', '-' ], { stdin: JSON.stringify(submitted), timeout: 15000 });
		const after = readEntry(ctx.env, file);

		// The file decides: the new key is there → committed. Installed and verified only when the entry is
		// exactly the one submitted (nothing is run against it: `mcp get` would contact whatever it points at)
		if ((after.kind == 'entry') && (after.fp == fp)) {
			return outcome(!!after.owned && (canonicalDigest(after.value) == canonicalDigest(submitted)));
		};
		// Still running (it may still write), or the file can't be read: the key may be (or become) installed
		if (add.indeterminate || (after.kind == 'unreadable')) {
			return outcome(false, { running: !!add.indeterminate });
		};
		return failed('cliFailed', (before.kind == 'entry') && (after.kind == 'absent'));
	},

	/** Against the record's own profile file, whatever Claude Code resolves today */
	remove: async (ctx: Ctx, rec: AiRecord): Promise<{ ok: boolean; left?: 'entry'; error?: AiError }> => {
		const homes = homesForProfile(ctx, rec.targetPath);

		// No way to point the CLI at exactly that file: leave it, reported
		if (!homes) {
			return { ok: false, left: 'entry', error: err('read', 'changed', rec.targetPath) };
		};

		const entry = readEntry(ctx.env, rec.targetPath);

		if (entry.kind == 'absent') {
			return { ok: true };
		};
		if (entry.kind == 'unreadable') {
			return { ok: false, left: 'entry', error: err('read', 'unparseable', rec.targetPath) };
		};
		if (!mcpOwned(entry, rec)) {
			return { ok: false, error: err('validate', 'conflict', rec.targetPath) };
		};
		if (!homesForProfile(ctx, rec.targetPath)) {
			return { ok: false, left: 'entry', error: err('write', 'changed', rec.targetPath) };
		};

		const rm = await runCli(ctx.env, homes, 'claude', REMOVE, { timeout: 15000 });
		return (readEntry(ctx.env, rec.targetPath).kind == 'absent') ? { ok: true } : { ok: false, left: 'entry', error: err('cli', rm.indeterminate ? 'timeout' : 'cliFailed') };
	},

	/** Read-only: never runs the CLI (`mcp get` health-checks and can start servers) */
	check: async (ctx: Ctx, rec: AiRecord): Promise<CheckOutcome> => {
		const entry = readEntry(ctx.env, rec.targetPath);

		if (entry.kind == 'absent') {
			return { status: rec.observedInstalled ? 'removed' : 'pending' };
		};
		if (entry.kind == 'unreadable') {
			return { status: 'unreadable' };
		};
		if (!entry.owned || !rec.keyFp || (entry.owned.fp != rec.keyFp)) {
			return { status: 'conflict' };
		};

		const pf = profileFor(ctx);

		// Claude Code reads another profile now, or Claude's file isn't edited by Anytype for a port change: reconnect
		if (('error' in pf) || (pf.file != rec.targetPath) || (ctx.port && (entry.owned.port != ctx.port))) {
			return { status: 'reconnect', observedInstalled: true };
		};
		return { status: 'ok', observedInstalled: true };
	},

	/** The key the installed entry carries, whatever its shape (an unconfirmed delivery is kept when it is there) */
	installedFp: async (ctx: Ctx, rec: AiRecord): Promise<string | null | 'unreadable'> => {
		const entry = readEntry(ctx.env, rec.targetPath);

		if (entry.kind == 'entry') {
			return entry.fp;
		};
		return (entry.kind == 'absent') ? null : 'unreadable';
	},
};

// ---------------------- the adapter ---------------------- //

const unusableHome = (ctx: Ctx): boolean => !ctx.homes.claudeHome || ctx.homes.rejected.includes('CLAUDE_CONFIG_DIR');

export const claudeCode: Adapter = {
	ids: [ 'claude-code' ],
	target: (env, det: Detected) => (det.targetId && det.targetPaths[0]) ? { targetId: det.targetId, path: det.targetPaths[0] } : null,
	plan: async (ctx, det, rec) => {
		const route = effectiveRoute(ctx);
		const base: AiPlan = { ...basePlan(ctx, { targetId: ctx.targetId, method: 'config', nextStep: 'newSession', displayTarget: '', sentenceKey: 'aiConnectPlanSkill', route: route.route }), instructions: INSTRUCTIONS };

		if (route.note) {
			base.note = route.note;
		};
		if (unusableHome(ctx)) {
			return manualPlan(base, err('detect', 'outsideHome'), []);
		};
		return (route.route == 'skill') ? skillRoute.plan(ctx, rec, base) : mcpRoute.plan({ ...ctx, route: 'http' }, rec, base);
	},
	apply: async (ctx, det, rec) => {
		if (unusableHome(ctx)) {
			return { ok: false, error: err('detect', 'outsideHome') };
		};

		const route = effectiveRoute(ctx).route;

		// The file the EFFECTIVE route writes (skill → settings.json, MCP tools → .claude.json) must be the one previewed
		if (ctx.previewTarget !== undefined) {
			const settings = resolveTarget(ctx.env, settingsFile(ctx.env, ctx.homes));
			const profile = profileFor(ctx);
			const dest = (route == 'skill') ? (('real' in settings) ? settings.real : '') : (('file' in profile) ? profile.file : '');

			if (!dest || !samePath(ctx.env, dest, ctx.previewTarget)) {
				return { ok: false, error: err('write', 'changed') };
			};
		};
		return (route == 'skill') ? skillRoute.apply(ctx, rec) : mcpRoute.apply({ ...ctx, route: 'http' }, rec);
	},
	remove: (ctx, rec) => (rec.route == 'skill') ? skillRoute.remove(ctx, rec) : mcpRoute.remove(ctx, rec),
	check: (ctx, rec) => (rec.route == 'skill') ? skillRoute.check(ctx, rec) : mcpRoute.check(ctx, rec),
	update: async (ctx, rec, change) => (rec.route == 'skill')
		? skillRoute.update(ctx, rec, change)
		// MCP tools: Claude's file is only changed through the CLI → the UI reconnects instead
		: { ok: false, error: err('validate', 'unsupportedForm') },
	installedFp: (ctx, rec) => (rec.route == 'skill') ? skillRoute.installedFp(ctx, rec) : mcpRoute.installedFp(ctx, rec),
	canRestart: () => false,
	separateRoutes: true,
};
