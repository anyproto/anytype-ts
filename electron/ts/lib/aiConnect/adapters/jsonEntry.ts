/**
 * Route A: an `anytype` entry holding the key, inside another app's JSON or TOML settings file.
 * One engine for Cursor, Copilot, LM Studio's file route and Codex / ChatGPT.
 *
 * - Ownership: the entry is ours when its key's fingerprint is the record's AND every field is exactly
 *   what Anytype writes for some port and tier (a hand-edited host or an extra field → not ours).
 * - Replace: a foreign entry is replaced only with `ctx.replace` naming this file and the digest of the
 *   entry as it is now, checked again on every writer retry.
 * - Writes: snapshot → edit (guarded) → writeFileSafe (secret) → read back; one re-plan on `changed`
 *   (the precondition checked again, see common.mayWrite: a heal never re-adds an entry the user
 *   removed, an install never re-adds one deleted meanwhile), then `changed`.
 * - The plan runs the writer's own edit on the previewed bytes: a form the writer can't edit is manual
 *   before any key exists.
 */
import type { AiError, AiNextStep, AiPlan, AiRecord, AiStep, AiTier, ApplyOutcome, CheckOutcome, Ctx, Env } from '../types';
import { dirsWritable, readSnapshot, resolveTarget, writeFileSafe, type Snapshot } from '../fsSafe';
import { getJsonPath, mutationOnly, readJson, removeJsonPath, setIn, setJsonPath, type JsonPath } from '../jsonFile';
import { getTomlPath, readToml, removeTomlTable, setTomlTable, tomlString } from '../tomlFile';
import { getYamlPath, readYaml, removeYamlPath, setYamlPath, yamlSnippet, type YamlPath } from '../yamlFile';
import { canonicalDigest, keyFingerprint } from '../digest';
import { basePlan, displayPath, err, forbiddenPlace, goneError, looseFile, manualPlan, mayWrite, mergeStep, placeholder, protectedError, protectedTarget, stillLive, type WriteMode } from './common';

export type EditResult = { ok: true; text: string } | { ok: false; category: 'unparseable' | 'unsupportedForm' };

/** How the entry is found and changed in one file format */
export interface EntryFormat {
	/** The installed entry (undefined when there is none), or null when the file can't be parsed */
	read (text: string | null): { value: any } | null;
	set (text: string | null, entry: any): EditResult;
	remove (text: string | null): EditResult;
	/** Manual steps for this file; `text` is the file as previewed (null: missing or not read) */
	steps (env: Env, file: string, entry: any, text: string | null): AiStep[];
};

/** `{ a: { b: value } }` for the path [ 'a', 'b' ] */
const nested = (path: JsonPath, value: any): any => path.slice().reverse().reduce((acc, k) => ({ [k]: acc }), value);

/** `mcpServers.anytype` (or another path) in a JSON / JSONC file */
export const jsonFormat = (path: JsonPath): EntryFormat => ({
	read: text => {
		const doc = readJson(text);
		return ('value' in doc) ? { value: getJsonPath(text, path) } : null;
	},
	set: (text, entry) => {
		const res = setJsonPath(text, path, entry);

		if (('text' in res) && !mutationOnly(text, res.text, doc => setIn(doc, path, entry))) {
			return { ok: false, category: 'unparseable' };
		};
		return res;
	},
	remove: text => {
		const res = removeJsonPath(text, path);

		if (('text' in res) && !mutationOnly(text, res.text, doc => setIn(doc, path, undefined))) {
			return { ok: false, category: 'unparseable' };
		};
		return res;
	},
	// The whole document to merge: pasted into an empty file it is the file (see common.mergeStep)
	steps: (env, file, entry) => [
		{ textKey: 'aiConnectManualOpen', args: [ displayPath(env, file) ], path: file },
		mergeStep(nested(path, entry)),
	],
});

/** The TOML body Anytype writes for `[mcp_servers.anytype]` */
export const codexBody = (entry: { url: string; http_headers: { Authorization: string } }): string => [
	`url = ${tomlString(entry.url)}`,
	`http_headers = { Authorization = ${tomlString(entry.http_headers.Authorization)} }`,
].join('\n') + '\n';

/** The inline member Anytype's entry is, for a config that defines `mcp_servers` as an inline table */
export const codexMember = (entry: { url: string; http_headers: { Authorization: string } }): string => `anytype = { url = ${tomlString(entry.url)}, http_headers = { Authorization = ${tomlString(entry.http_headers.Authorization)} } }`;

/**
 * How the manual Codex step must read for the file as it is: an existing `[mcp_servers.anytype]` table is
 * REPLACED (never a second one appended); an inline `mcp_servers = { … }` gets the entry as a member inside
 * it; otherwise the complete table is appended at the end. Each yields a file the TOML reader accepts.
 */
const tomlStep = (text: string | null, entry: any): AiStep => {
	const doc = text ? readToml(text) : null;
	const table = /^\s*\[\s*mcp_servers\s*\.\s*anytype\s*\]/m.test(text || '');
	const header = /^\s*\[\s*mcp_servers\s*[.\]]/m.test(text || '');

	if (table) {
		return { textKey: 'aiConnectManualReplaceTable', args: [ '[mcp_servers.anytype]' ], snippet: `[mcp_servers.anytype]\n${codexBody(entry)}`, lang: 'toml' };
	};
	if (doc && (doc.mcp_servers !== undefined) && !header) {
		// An `anytype` member already inside the inline table is replaced, never added twice
		const exists = (typeof doc.mcp_servers == 'object') && Object.prototype.hasOwnProperty.call(doc.mcp_servers, 'anytype');
		return { textKey: exists ? 'aiConnectManualReplaceMember' : 'aiConnectManualAddMember', args: [ 'anytype', 'mcp_servers' ], snippet: codexMember(entry), lang: 'toml' };
	};
	return { textKey: 'aiConnectManualAppend', snippet: `[mcp_servers.anytype]\n${codexBody(entry)}`, lang: 'toml' };
};

/** `[mcp_servers.anytype]` in Codex's config.toml; the guard lives in tomlFile */
/** `mcp_servers.anytype` (or another path) in a YAML file, comments kept (yamlFile) */
export const yamlFormat = (path: YamlPath): EntryFormat => ({
	read: text => (('value' in readYaml(text)) ? { value: getYamlPath(text, path) } : null),
	set: (text, entry) => setYamlPath(text, path, entry),
	remove: text => removeYamlPath(text, path),
	steps: (env, file, entry) => [
		{ textKey: 'aiConnectManualOpen', args: [ displayPath(env, file) ], path: file },
		{ textKey: 'aiConnectManualMerge', snippet: yamlSnippet(path, entry), lang: 'yaml' },
	],
});

export const tomlFormat = (): EntryFormat => ({
	read: text => (readToml(text) ? { value: getTomlPath(text, [ 'mcp_servers', 'anytype' ]) } : null),
	set: (text, entry) => setTomlTable(text, 'mcp_servers.anytype', codexBody(entry)),
	remove: text => removeTomlTable(text, 'mcp_servers.anytype'),
	steps: (env, file, entry, text) => [
		{ textKey: 'aiConnectManualOpen', args: [ displayPath(env, file) ], path: file },
		tomlStep(text, entry),
	],
});

export interface FileEntrySpec {
	format: EntryFormat;
	/** The entry Anytype writes for a port, tier and key */
	entry (port: number, tier: AiTier, key: string): any;
	/** The port and tier of an installed entry's URL, or null */
	address (value: any): { port: number; tier: AiTier } | null;
	/** The key an installed entry carries, or null */
	keyOf (value: any): string | null;
	nextStep: AiNextStep;
	sentenceKey: string;
};

interface Owned {
	port: number;
	tier: AiTier;
	key: string;
	fp: string;
};

/** The parts of an installed entry Anytype could have written, or null (foreign shape) */
export const ownedFields = (spec: FileEntrySpec, value: any): Owned | null => {
	const address = spec.address(value);
	const key = spec.keyOf(value);

	if (!address || !key) {
		return null;
	};
	if (canonicalDigest(value) != canonicalDigest(spec.entry(address.port, address.tier, key))) {
		return null;
	};
	return { ...address, key, fp: keyFingerprint(key) };
};

/** The record owns this entry: its fingerprint and the fields Anytype writes */
const ownedBy = (spec: FileEntrySpec, value: any, rec: AiRecord | null): Owned | null => {
	const owned = ownedFields(spec, value);
	return (owned && rec && rec.keyFp && (owned.fp == rec.keyFp)) ? owned : null;
};

interface Target {
	real: string;
	snapshot: Snapshot;
	/** The installed entry, undefined when absent */
	value: any;
};

/** Resolve (under home, never into Anytype's own folders), snapshot and parse; any problem is an error */
const load = (env: Env, file: string, format: EntryFormat): Target | { error: AiError } => {
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

	const parsed = format.read(snapshot.text);

	if (!parsed) {
		return { error: err('parse', 'unparseable', target.real) };
	};
	return { real: target.real, snapshot, value: parsed.value };
};

const present = (value: any): boolean => (value !== undefined) && (value !== null);

/** A replace consent that names exactly this file and this entry */
const replaceMatches = (ctx: Ctx, t: Target): boolean => !!ctx.replace && (ctx.replace.targetPath == t.real) && (ctx.replace.foreignDigest == canonicalDigest(t.value));

/**
 * Writes `entry` into the file when the precondition of `mode` holds on this attempt (common.mayWrite).
 * One re-plan on `changed`. `gone`: an entry that was there (or had to be) isn't any more.
 */
const write = async (ctx: Ctx, spec: FileEntrySpec, file: string, rec: AiRecord | null, entry: any, mode: WriteMode): Promise<{ ok: true; real: string; createdDirs: string[] } | { ok: false; error: AiError; gone?: boolean }> => {
	let wasPresent = false;

	for (let attempt = 0; attempt < 2; attempt++) {
		const t = load(ctx.env, file, spec.format);

		if ('error' in t) {
			return { ok: false, error: t.error };
		};

		const here = present(t.value);

		if (!attempt) {
			wasPresent = here;
		};

		const verdict = mayWrite({ mode, present: here, owned: here && !!ownedBy(spec, t.value, rec), consent: here && replaceMatches(ctx, t), consentHere: ctx.replace?.targetPath == t.real, wasPresent });

		if (verdict == 'conflict') {
			return { ok: false, error: err('validate', 'conflict', t.real) };
		};
		if (verdict == 'gone') {
			return { ok: false, gone: true, error: goneError(mode, t.real) };
		};

		const edit = spec.format.set(t.snapshot.text, entry);

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

	return { ok: false, error: err('write', 'changed', file) };
};

/** The entry as it is in the file right now equals `entry` */
const readBack = (env: Env, real: string, spec: FileEntrySpec, entry: any): boolean => {
	const snapshot = readSnapshot(env, real);
	const parsed = ('text' in snapshot) ? spec.format.read(snapshot.text) : null;

	return !!parsed && present(parsed.value) && (canonicalDigest(parsed.value) == canonicalDigest(entry));
};

export const fileEntry = (spec: FileEntrySpec) => {

	/** Reads, never writes */
	const plan = (ctx: Ctx, file: string | null, rec: AiRecord | null): AiPlan => {
		const base: AiPlan = { ...basePlan(ctx, { targetId: ctx.targetId, method: 'config', nextStep: spec.nextStep, displayTarget: file ? displayPath(ctx.env, file) : '', sentenceKey: spec.sentenceKey }) };
		const sample = spec.entry(ctx.port, ctx.tier, placeholder);

		if (!file) {
			return manualPlan(base, err('detect', 'notFound'), []);
		};

		const t = load(ctx.env, file, spec.format);

		if ('error' in t) {
			return manualPlan(base, t.error, forbiddenPlace(t.error) ? [] : spec.format.steps(ctx.env, file, sample, null));
		};

		const steps = spec.format.steps(ctx.env, file, sample, t.snapshot.text);
		const ret: AiPlan = { ...base, displayTarget: displayPath(ctx.env, t.real), targetPath: t.real, steps };

		// The writer's own edit on the previewed bytes (a form it can't edit, an inline TOML table, …) and its directory rules: manual now
		const dry = spec.format.set(t.snapshot.text, sample);

		if (!('text' in dry)) {
			return manualPlan(ret, err('parse', dry.category, t.real), steps);
		};

		const dirs = dirsWritable(ctx.env, t.real);

		if (dirs) {
			return manualPlan(ret, dirs, steps);
		};

		if (present(t.value)) {
			if (ownedBy(spec, t.value, rec)) {
				ret.existing = 'ours';
			} else {
				ret.existing = 'foreign';
				ret.replace = { targetPath: t.real, foreignDigest: canonicalDigest(t.value) };
			};
		};
		return ret;
	};

	/** Commit = the write of the file */
	const apply = async (ctx: Ctx, file: string | null, rec: AiRecord | null): Promise<ApplyOutcome> => {
		if (!file) {
			return { ok: false, error: err('detect', 'notFound') };
		};

		const entry = spec.entry(ctx.port, ctx.tier, ctx.key);
		const res = await write(ctx, spec, file, rec, entry, 'install');

		if ('error' in res) {
			return { ok: false, error: res.error };
		};

		return {
			ok: true,
			method: 'config',
			nextStep: spec.nextStep,
			targetPath: res.real,
			observedInstalled: readBack(ctx.env, res.real, spec, entry),
			createdDirs: res.createdDirs,
		};
	};

	/** Removes our entry; a missing file or entry is success; a foreign one is left alone (`conflict`) */
	const remove = async (ctx: Ctx, rec: AiRecord): Promise<{ ok: boolean; left?: 'entry'; error?: AiError }> => {
		for (let attempt = 0; attempt < 2; attempt++) {
			const t = load(ctx.env, rec.targetPath, spec.format);

			if ('error' in t) {
				// Gone with its directory, or never written: nothing of ours is there
				if ((t.error.category == 'notFound')) {
					return { ok: true };
				};
				return { ok: false, left: 'entry', error: t.error };
			};
			if (!present(t.value)) {
				return { ok: true };
			};
			if (!ownedBy(spec, t.value, rec)) {
				return { ok: false, error: err('validate', 'conflict', t.real) };
			};

			const edit = spec.format.remove(t.snapshot.text);

			if (!('text' in edit)) {
				return { ok: false, left: 'entry', error: err('parse', edit.category, t.real) };
			};

			const res = await writeFileSafe(ctx.env, t.real, edit.text, { snapshot: t.snapshot, secret: true });

			if ('createdDirs' in res) {
				return { ok: true };
			};
			if ('error' in res) {
				return { ok: false, left: 'entry', error: res.error };
			};
		};

		return { ok: false, left: 'entry', error: err('write', 'changed', rec.targetPath) };
	};

	/**
	 * Rewrites our entry at another port / tier with the key already in it. Never re-adds an entry that is
	 * gone (`gone`), and never reuses a key from a file others can write (`permission`).
	 */
	const rewrite = async (ctx: Ctx, rec: AiRecord, port: number, tier: AiTier): Promise<{ ok: true } | { ok: false; error: AiError; gone?: boolean }> => {
		const t = load(ctx.env, rec.targetPath, spec.format);

		if ('error' in t) {
			return { ok: false, error: t.error };
		};

		const owned = present(t.value) ? ownedBy(spec, t.value, rec) : null;

		if (!owned) {
			return present(t.value) ? { ok: false, error: err('validate', 'conflict', t.real) } : { ok: false, gone: true, error: err('read', 'notFound', t.real) };
		};
		if (looseFile(ctx.env, t.snapshot.mode)) {
			return { ok: false, error: err('read', 'permission', t.real) };
		};

		const res = await write(ctx, spec, rec.targetPath, rec, spec.entry(port, tier, owned.key), 'owned');
		return ('error' in res) ? { ok: false, error: res.error, ...(res.gone ? { gone: true } : {}) } : { ok: true };
	};

	/** Passive state; heals a port or tier difference (only called with a live port) */
	const check = async (ctx: Ctx, rec: AiRecord): Promise<CheckOutcome> => {
		const t = load(ctx.env, rec.targetPath, spec.format);

		if ('error' in t) {
			if (t.error.category == 'notFound') {
				return { status: rec.observedInstalled ? 'removed' : 'pending' };
			};
			return { status: 'unreadable' };
		};
		if (!present(t.value)) {
			return { status: rec.observedInstalled ? 'removed' : 'pending' };
		};

		const owned = ownedBy(spec, t.value, rec);

		if (!owned) {
			return { status: 'conflict' };
		};

		if (ctx.port && ((owned.port != ctx.port) || (owned.tier != rec.tier))) {
			// The API stopped meanwhile: no heal (the service keeps the last status, B2)
			if (!stillLive(ctx)) {
				return { status: 'pending' };
			};

			const res = await rewrite(ctx, rec, ctx.port, rec.tier);

			if (res.ok) {
				return { status: 'ok', healed: true, nextStep: spec.nextStep, observedInstalled: true };
			};
			// Removed in the app while Anytype was healing it: reported, never re-added
			return { status: ('gone' in res) ? 'removed' : 'reconnect', observedInstalled: true };
		};

		return { status: 'ok', observedInstalled: true };
	};

	const update = async (ctx: Ctx, rec: AiRecord, change: { tier?: AiTier; port?: number }): Promise<{ ok: boolean; nextStep?: AiNextStep; error?: AiError }> => {
		const res = await rewrite(ctx, rec, change.port || rec.port, change.tier || rec.tier);
		return ('error' in res) ? { ok: false, error: res.error } : { ok: true, nextStep: spec.nextStep };
	};

	/** The fingerprint the installed entry carries now */
	const installedFp = async (ctx: Ctx, rec: AiRecord): Promise<string | null | 'unreadable'> => {
		const t = load(ctx.env, rec.targetPath, spec.format);

		if ('error' in t) {
			return (t.error.category == 'notFound') ? null : 'unreadable';
		};

		const key = present(t.value) ? spec.keyOf(t.value) : null;
		return key ? keyFingerprint(key) : null;
	};

	return { plan, apply, remove, check, update, installedFp, rewrite };
};
