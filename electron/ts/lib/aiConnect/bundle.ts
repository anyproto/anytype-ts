/**
 * The static Claude Desktop bundle `dist/mcp/Anytype.mcpb` (a `binary` bundle with the signed forwarder
 * inside, no key) and the copy Anytype hands to Claude.
 *
 * The bundle is described by the build's metadata (forwarder.buildMeta): the archive's sha256, its signer
 * and its version `2.<forwarder rev>.0`. The bytes main delivers are the bytes it hashed, in memory.
 *
 * The copy goes to `<home>/.anytype/ai-connect/Anytype.mcpb`. That folder also holds the forwarder's
 * `items` / `items-dev`, which anytype-ts never reads or writes. Every directory on the way down from the
 * real home must be a real directory (not a link) and, on POSIX, the user's and not writable by others.
 */
import type { AiError, Env } from './types';
import { MODE_DIR, dirIdentity, discardTemp, keepTemp, pathOf, realHome, sameDir, stageTemp, type DirIdentity, type StagedTemp } from './fsSafe';
import { buildMeta, protectNewDir, sha256 } from './forwarder';

export const BUNDLE_NAME = 'Anytype.mcpb';
const MAX_BUNDLE_BYTES = 64 * 1024 * 1024;

export interface BundleInfo {
	signed: boolean;
	sha256: string;
	signerFingerprint?: string;
	/** `2.<forwarder rev>.0`: an installed extension must be at this version or higher */
	version: string;
	/**
	 * The archive doesn't match the metadata (a damaged, replaced or half-rebuilt bundle). `signed` is
	 * false for display, but this is NOT the unsigned development bundle: the package route is refused.
	 */
	integrityError?: true;
};

/** Where the build put the bundle and the skill */
export const mcpDir = (env: Env): string => pathOf(env).join(env.appRoot, 'dist', 'mcp');

export const bundlePath = (env: Env): string => pathOf(env).join(mcpDir(env), BUNDLE_NAME);

/**
 * The bundle as the metadata describes it, with the bytes that were hashed. null when the build has no
 * bundle (Linux, a build without a forwarder) or the archive can't be read.
 */
export const loadBundle = (env: Env): { info: BundleInfo; data: Buffer } | null => {
	const meta = buildMeta(env);

	if (!meta?.mcpb) {
		return null;
	};

	const archive = env.readFile(bundlePath(env), MAX_BUNDLE_BYTES);

	if (!('data' in archive)) {
		return null;
	};

	const actual = sha256(archive.data);

	if (actual != meta.mcpb.sha256) {
		return { info: { signed: false, sha256: actual, version: meta.mcpb.version, integrityError: true }, data: archive.data };
	};

	const info: BundleInfo = { signed: meta.signed, sha256: actual, version: meta.mcpb.version };

	if (meta.signed) {
		info.signerFingerprint = meta.mcpb.signerFingerprint;
	};
	return { info, data: archive.data };
};

export const bundleInfo = (env: Env): BundleInfo | null => loadBundle(env)?.info || null;

/** The bundle may be installed (and its extension given a key): present, and its archive matches the metadata */
export const bundleUsable = (info: BundleInfo | null): boolean => !!info && !info.integrityError;

/** `<home>/.anytype/ai-connect`, outermost directory first */
const dirChain = (env: Env): string[] => {
	const P = pathOf(env);
	const base = P.join(env.home, '.anytype');

	return [ base, P.join(base, 'ai-connect') ];
};

/** Anytype's own folder in the user's home: never another app's target */
export const anytypeHomeDir = (env: Env): string => dirChain(env)[0];

export const bundleDir = (env: Env): string => dirChain(env)[1];

const posix = (env: Env): boolean => (env.platform != 'win32') && (env.uid !== null);

/**
 * Every directory of the chain is a real directory of ours that group and others can't write; missing
 * ones are created 0700 (`create`). The forwarder applies the same rules to this folder and refuses a
 * looser one, so nothing here loosens what it finds.
 */
const checkChain = async (env: Env, create: boolean): Promise<boolean> => {
	for (const dir of dirChain(env)) {
		let st = env.lstat(dir);

		if (!st) {
			if (!create) {
				return false;
			};
			try {
				env.mkdir(dir, MODE_DIR);
				env.chmod(dir, MODE_DIR);
			} catch (e) {
				return false;
			};
			// Windows: heart's protected list on a folder Anytype creates on the store path (Q17)
			if (!(await protectNewDir(env, dir))) {
				try {
					env.rmdir(dir);
				} catch (e) { /* left */ };
				return false;
			};
			st = env.lstat(dir);
		};
		if (!st || st.isSymlink || !st.isDir) {
			return false;
		};
		if (posix(env) && ((st.uid != env.uid) || (st.mode & 0o022))) {
			return false;
		};
	};
	return true;
};

/** `<home>/.anytype/ai-connect` is there and private (created when missing): the folder of the bundle copy and of Claude's operation lock */
export const ensureStoreDir = (env: Env): Promise<boolean> => checkChain(env, true);

const fail = (category: AiError['category'], path?: string): { ok: false; error: AiError } => ({ ok: false, error: { stage: 'write', category, ...(path ? { path } : {}) } });

/**
 * Writes the verified bundle bytes to `<home>/.anytype/ai-connect/Anytype.mcpb`: an exclusive temp staged
 * under the identity contract, then renamed into place. A link (or directory) at the destination is
 * refused, never written through.
 */
export const copyBundle = async (env: Env, data: Buffer): Promise<{ ok: true; path: string } | { ok: false; error: AiError }> => {
	const P = pathOf(env);
	const dest = P.join(bundleDir(env), BUNDLE_NAME);
	const destOk = () => {
		const st = env.lstat(dest);
		return !st || (!st.isSymlink && st.isFile);
	};

	if (!(await checkChain(env, true)) || !destOk()) {
		return fail('permission', dest);
	};

	const real = env.realpath(bundleDir(env));
	const dir: DirIdentity | null = real ? dirIdentity(env, real, realHome(env)) : null;

	if (!dir) {
		return fail('permission', dest);
	};

	let temp: StagedTemp | null = null;

	try {
		const staged = stageTemp(env, dir, realHome(env), `.${BUNDLE_NAME}.${env.now()}-${Math.random().toString(16).slice(2, 10)}.tmp`, data, 0o644);

		if (staged == 'changed') {
			return fail('permission', dest);
		};

		temp = staged;
		env.chmod(temp.path, 0o644);

		if (!sameDir(env, dir, realHome(env)) || !(await checkChain(env, false)) || !destOk()) {
			discardTemp(env, temp);
			temp = null;
			return fail('permission', dest);
		};

		env.rename(temp.path, P.join(dir.path, BUNDLE_NAME));
		keepTemp(temp);
		temp = null;
	} catch (e) {
		if (temp) {
			discardTemp(env, temp);
		};
		return fail('unknown', dest);
	};

	return { ok: true, path: dest };
};
