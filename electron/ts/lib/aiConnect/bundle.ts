/**
 * The static Claude Desktop bundle `dist/mcp/Anytype.mcpb` (a `binary` bundle with the signed forwarder
 * inside, no key) and the copy Anytype hands to Claude.
 *
 * The bundle is described by the build's metadata (forwarder.buildMeta): the archive's sha256, its signer
 * and its version `2.<forwarder rev>.0`. The bytes main delivers are the bytes it hashed, in memory.
 *
 * The copy goes to `<home>/.anytype/ai-connect/Anytype[-dev]-<first 12 hex of its sha256>.mcpb` (older copies
 * of the same flavour are removed). That folder also holds the endpoint file (endpoint.ts) and Claude's
 * operation lock. Every directory on the way down from the real home must be a real directory (not a link)
 * and, on POSIX, the user's and not writable by others.
 */
import zlib from 'zlib';
import type { AiError, Env } from './types';
import { MODE_DIR, dirIdentity, discardTemp, keepTemp, pathOf, realHome, sameDir, stageTemp, type DirIdentity, type StagedTemp } from './fsSafe';
import { buildMeta, privateOnWindows, protectNewDir, sha256 } from './forwarder';

export const BUNDLE_NAME = 'Anytype.mcpb';

/** The copy's name: the flavour and the archive's digest, so a release and a dev build never share one */
export const copyName = (signed: boolean, digest: string): string => `${signed ? 'Anytype' : 'Anytype-dev'}-${digest.slice(0, 12)}.mcpb`;

const copyRe = (signed: boolean): RegExp => signed ? /^Anytype-[0-9a-f]{12}\.mcpb$/ : /^Anytype-dev-[0-9a-f]{12}\.mcpb$/;

/** Where the copy of this build's bundle goes (whether or not it is there yet); '' without a bundle */
export const copyPath = (env: Env): string => {
	const info = bundleInfo(env);
	return (info && !info.integrityError) ? pathOf(env).join(bundleDir(env), copyName(info.signed, info.sha256)) : '';
};
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

const SIG_HEADER = Buffer.from('MCPB_SIG_V1', 'utf8');
const SIG_FOOTER = Buffer.from('MCPB_SIG_END', 'utf8');

/** A signed bundle ends with `MCPB_SIG_V1 <u32le length> <DER> MCPB_SIG_END` (scripts/sign-mcpb-azure.js): the zip is what precedes it */
const zipPart = (buf: Buffer): Buffer => {
	const footer = buf.length - SIG_FOOTER.length;

	if ((footer < 0) || !buf.subarray(footer).equals(SIG_FOOTER)) {
		return buf;
	};

	const header = buf.lastIndexOf(SIG_HEADER, footer);
	const lenAt = header + SIG_HEADER.length;

	if ((header < 0) || ((lenAt + 4) > footer) || ((lenAt + 4 + buf.readUInt32LE(lenAt)) != footer)) {
		return buf;
	};
	return buf.subarray(0, header);
};

/**
 * One file of a zip archive by its exact name (stored or deflated), at most `maxBytes`; null when it isn't there
 * or the archive isn't one this reader understands. Only for the bundle's own, digest-checked archive
 */
export const zipEntry = (archive: Buffer, name: string, maxBytes: number): Buffer | null => {
	const zip = zipPart(archive);
	let end = -1;

	for (let i = zip.length - 22; (i >= 0) && (i >= (zip.length - 22 - 0xffff)); i--) {
		if (zip.readUInt32LE(i) == 0x06054b50) {
			end = i;
			break;
		};
	};
	if (end < 0) {
		return null;
	};

	const count = zip.readUInt16LE(end + 10);
	let at = zip.readUInt32LE(end + 16);

	for (let n = 0; n < count; n++) {
		if (((at + 46) > zip.length) || (zip.readUInt32LE(at) != 0x02014b50)) {
			return null;
		};

		const method = zip.readUInt16LE(at + 10);
		const packed = zip.readUInt32LE(at + 20);
		const size = zip.readUInt32LE(at + 24);
		const nameLen = zip.readUInt16LE(at + 28);
		const local = zip.readUInt32LE(at + 42);
		const entry = zip.toString('utf8', at + 46, at + 46 + nameLen);

		at += 46 + nameLen + zip.readUInt16LE(at + 30) + zip.readUInt16LE(at + 32);
		if (entry != name) {
			continue;
		};
		if ((size > maxBytes) || ((local + 30) > zip.length) || (zip.readUInt32LE(local) != 0x04034b50)) {
			return null;
		};

		const start = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);

		if ((start + packed) > zip.length) {
			return null;
		};

		const raw = zip.subarray(start, start + packed);

		try {
			const data = (method == 0) ? Buffer.from(raw) : ((method == 8) ? zlib.inflateRawSync(raw, { maxOutputLength: maxBytes }) : null);
			return (data && (data.length == size)) ? data : null;
		} catch (e) {
			return null;
		};
	};
	return null;
};

/** The manifest of the bundle this build ships, per archive digest (the archive is read and hashed once) */
const shippedManifests = new WeakMap<Env, { sha256: string; manifest: any }>();

/**
 * The manifest of the bundle this build ships, read out of its digest-checked archive; null without a usable
 * bundle, or when it can't be read. What Claude installed must match it exactly (F1)
 */
export const bundleManifest = (env: Env, info: BundleInfo | null): any | null => {
	if (!info || !bundleUsable(info)) {
		return null;
	};

	const known = shippedManifests.get(env);

	if (known && (known.sha256 == info.sha256)) {
		return known.manifest;
	};

	const loaded = loadBundle(env);

	if (!loaded || !bundleUsable(loaded.info) || (loaded.info.sha256 != info.sha256)) {
		return null;
	};

	const data = zipEntry(loaded.data, 'manifest.json', 1024 * 1024);
	let manifest: any = null;

	try {
		manifest = data ? JSON.parse(data.toString('utf8')) : null;
	} catch (e) { /* not one */ };

	if (manifest && (typeof manifest == 'object')) {
		shippedManifests.set(env, { sha256: info.sha256, manifest });
		return manifest;
	};
	return null;
};

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
	// Windows: folders that were there already pass only when nobody but the user, SYSTEM and Administrators is granted anything (S5's query)
	return posix(env) || privateOnWindows(env, dirChain(env));
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
	const signed = !!buildMeta(env)?.signed;
	const name = copyName(signed, sha256(data));
	const dest = P.join(bundleDir(env), name);
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
		const staged = stageTemp(env, dir, realHome(env), `.${name}.${env.now()}-${Math.random().toString(16).slice(2, 10)}.tmp`, data, 0o644);

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

		env.rename(temp.path, P.join(dir.path, name));
		keepTemp(temp);
		temp = null;

		// Older copies of this flavour (another build's archive); the other flavour's are left alone
		for (const it of env.readDir(dir.path) || []) {
			if ((it != name) && copyRe(signed).test(it)) {
				try {
					env.unlink(P.join(dir.path, it));
				} catch (e) { /* the next copy tries again */ };
			};
		};
	} catch (e) {
		if (temp) {
			discardTemp(env, temp);
		};
		return fail('unknown', dest);
	};

	return { ok: true, path: dest };
};
