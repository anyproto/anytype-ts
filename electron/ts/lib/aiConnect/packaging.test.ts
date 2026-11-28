/**
 * scripts/prepare-forwarder.js (which binary a build ships, its namespace, when it must be signed) and
 * electron/hook/verify-forwarder.js (the packaged forwarder is the one the metadata and Anytype.mcpb
 * describe; anytype-mcp-plan §4.4, §4.5), on a package assembled in a temp folder.
 */
import { execFileSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { tempDir } from './testEnv';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const prepareForwarder = require('../../../../scripts/prepare-forwarder.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const buildMcp = require('../../../../scripts/build-mcp.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const verifier = require('../../../hook/verify-forwarder.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const asar = require('@electron/asar');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const JSZip = require('jszip');

const posix = (process.platform != 'win32');
const sha = (buf: Buffer | string) => crypto.createHash('sha256').update(buf).digest('hex');

/**
 * A stand-in for the Go binary: answers `version --json`; its bytes carry the revision marker (`marker`: another
 * revision, or '' for none) and, for the release one, the namespace marker
 */
const fakeBinary = (file: string, namespace: 'dev' | 'release', rev = 6, claims = namespace, marker: number | '' = rev) => {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, [
		'#!/bin/sh',
		(namespace == 'release') ? '# anytype-mcp-namespace:release' : '# a development build',
		(marker === '') ? '# no revision' : `# anytype-mcp-rev:${marker}`,
		`echo '${JSON.stringify({ version: 'test', commit: 'c', rev, namespace: claims, impl: 'go' })}'`,
		'',
	].join('\n'), { mode: 0o755 });
};

/** A Mach-O universal file (32-bit fat header) of the given slices, read the way the build reads one */
const fatFile = (file: string, slices: string[]) => {
	const bodies = slices.map(s => Buffer.from(s, 'utf8'));
	const header = Buffer.alloc(8 + (bodies.length * 20));
	let offset = 4096;

	header.writeUInt32BE(0xcafebabe, 0);
	header.writeUInt32BE(bodies.length, 4);
	bodies.forEach((b, i) => {
		header.writeUInt32BE(i ? 0x0100000c : 0x01000007, 8 + (i * 20));
		header.writeUInt32BE(offset, 8 + (i * 20) + 8);
		header.writeUInt32BE(b.length, 8 + (i * 20) + 12);
		header.writeUInt32BE(12, 8 + (i * 20) + 16);
		offset += 4096;
	});

	const out = Buffer.alloc(offset);

	header.copy(out, 0);
	bodies.forEach((b, i) => b.copy(out, 4096 * (i + 1)));
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, out, { mode: 0o755 });
};

let dir = '';
let root = '';

beforeEach(() => {
	dir = tempDir('aic-pack-');
	root = path.join(dir, 'repo');
	fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
	fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ homepage: 'https://anytype.io', build: { mac: {} } }));
	vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
	vi.restoreAllMocks();
	fs.rmSync(dir, { recursive: true, force: true });
});

describe.skipIf(!posix)('prepare-forwarder', () => {
	const prepare = (opt: Record<string, any> = {}) => prepareForwarder.prepare({ rootDir: root, env: {}, platform: 'linux', arch: 'x64', ...opt });
	const RELEASE = { FORWARDER_SIGN_REQUIRED: '1' };

	test('no binary: a development build goes on without the stdio routes (also in CI); the release flavour fails', async () => {
		expect(await prepare()).toBeNull();
		expect(await prepare({ env: { CI: 'true' } })).toBeNull();
		await expect(prepare({ env: RELEASE })).rejects.toThrow(/anytype-mcp-release/);
	});

	test('development (update.sh, or ANYTYPE_MCP_BIN for a locally built one): the dev-namespace binary as it is, `signed: false`', async () => {
		fakeBinary(path.join(root, 'dist', 'anytype-mcp'), 'dev');
		expect(await prepare()).toEqual({ signed: false, namespace: 'dev', rev: 6, files: { 'linux-x64': path.join(root, 'dist', 'anytype-mcp') }, bundleFile: null });

		const local = path.join(dir, 'built', 'anytype-mcp');

		fakeBinary(local, 'dev', 9);

		const res = await prepare({ env: { ANYTYPE_MCP_BIN: local } });

		expect(res).toMatchObject({ signed: false, rev: 9 });
		expect(fs.readFileSync(path.join(root, 'dist', 'anytype-mcp'))).toEqual(fs.readFileSync(local));
		await expect(prepare({ env: { ANYTYPE_MCP_BIN: path.join(dir, 'missing') } })).rejects.toThrow(/ANYTYPE_MCP_BIN/);
	});

	test('Linux release: one file per architecture stays in linux-amd / linux-arm; `signed: true` (nothing to sign)', async () => {
		fakeBinary(path.join(root, 'linux-amd', 'anytype-mcp'), 'release');
		fakeBinary(path.join(root, 'linux-arm', 'anytype-mcp'), 'release');

		expect(await prepare({ env: RELEASE })).toEqual({
			signed: true, namespace: 'release', rev: 6, bundleFile: null,
			files: { 'linux-x64': path.join(root, 'linux-amd', 'anytype-mcp'), 'linux-arm64': path.join(root, 'linux-arm', 'anytype-mcp') },
		});
	});

	test('Q8: the build flavour picks the namespace, never a reused checkout\'s leftovers', async () => {
		// A developer once ran update-ci.sh: release binaries sit in the per-arch folders
		fakeBinary(path.join(root, 'linux-amd', 'anytype-mcp'), 'release');
		fakeBinary(path.join(root, 'linux-arm', 'anytype-mcp'), 'release');
		fakeBinary(path.join(root, 'darwin-arm', 'anytype-mcp'), 'release');
		fakeBinary(path.join(root, 'darwin-amd', 'anytype-mcp'), 'release');

		// Development flavour with only those leftovers: no forwarder, never `signed: true` (Linux and macOS)
		expect(await prepare()).toBeNull();
		expect(await prepare({ platform: 'darwin' })).toBeNull();
		expect(fs.existsSync(path.join(root, 'dist', 'anytype-mcp'))).toBe(false);

		// …and with a locally built dev binary: that one is used
		const local = path.join(dir, 'built', 'anytype-mcp');

		fakeBinary(local, 'dev', 7);
		expect(await prepare({ env: { ANYTYPE_MCP_BIN: local } })).toEqual({ signed: false, namespace: 'dev', rev: 7, files: { 'linux-x64': path.join(root, 'dist', 'anytype-mcp') }, bundleFile: null });

		// A release-namespace binary in dist/ of a development build: the stdio routes are off, never the production namespace
		fakeBinary(path.join(root, 'dist', 'anytype-mcp'), 'release');
		expect(await prepare()).toBeNull();

		// Release flavour: a dev binary, or ANYTYPE_MCP_BIN, fails the build
		fakeBinary(path.join(root, 'linux-amd', 'anytype-mcp'), 'dev');
		fakeBinary(path.join(root, 'linux-arm', 'anytype-mcp'), 'dev');
		await expect(prepare({ env: RELEASE })).rejects.toThrow(/release-namespace/);
		await expect(prepare({ env: { ...RELEASE, ANYTYPE_MCP_BIN: local } })).rejects.toThrow(/development builds/);
		// macOS release needs both of update-ci.sh's files
		fs.rmSync(path.join(root, 'darwin-amd'), { recursive: true });
		await expect(prepare({ platform: 'darwin', env: RELEASE })).rejects.toThrow(/both architectures/);

		// update.sh from an archive without the dev member removes the previous forwarder
		expect(fs.readFileSync(path.join(__dirname, '../../../../update.sh'), 'utf8')).toMatch(/else\n\s*#[^\n]*\n\s*rm -f "\$folder\/anytype-mcp\$mcp_ext"\n\s*echo "NOTE/);
	});

	test('Q8: beforeBuild copies the per-arch Linux forwarder only in the release flavour', async () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const beforeBuild = require('../../../hook/beforebuild.js').default;
		const cwd = process.cwd();
		const flavour = process.env.FORWARDER_SIGN_REQUIRED;

		fakeBinary(path.join(root, 'linux-amd', 'anytype-mcp'), 'release');
		fakeBinary(path.join(root, 'linux-amd', 'anytypeHelper'), 'dev');
		process.chdir(root);
		try {
			delete process.env.FORWARDER_SIGN_REQUIRED;
			await beforeBuild({ platform: { name: 'linux' }, arch: 'x64' });
			expect(fs.existsSync(path.join(root, 'dist', 'anytypeHelper'))).toBe(true);
			expect(fs.existsSync(path.join(root, 'dist', 'anytype-mcp'))).toBe(false);

			process.env.FORWARDER_SIGN_REQUIRED = '1';
			await beforeBuild({ platform: { name: 'linux' }, arch: 'x64' });
			expect(fs.existsSync(path.join(root, 'dist', 'anytype-mcp'))).toBe(true);
		} finally {
			process.chdir(cwd);
			if (flavour === undefined) {
				delete process.env.FORWARDER_SIGN_REQUIRED;
			} else {
				process.env.FORWARDER_SIGN_REQUIRED = flavour;
			};
		};
	});

	test('the namespace is read off the file and must agree with `version --json`; mixed namespaces or revisions fail', async () => {
		expect(prepareForwarder.namespaceOf(path.join(__dirname, 'forwarder.ts'))).toBe('dev');

		fakeBinary(path.join(root, 'dist', 'anytype-mcp'), 'dev', 6, 'release');
		await expect(prepare()).rejects.toThrow(/does not agree/);
		// The marker and `version --json` name different revisions
		fakeBinary(path.join(root, 'dist', 'anytype-mcp'), 'dev', 7, 'dev', 6);
		await expect(prepare()).rejects.toThrow(/does not agree/);

		fakeBinary(path.join(root, 'linux-amd', 'anytype-mcp'), 'release');
		fakeBinary(path.join(root, 'linux-arm', 'anytype-mcp'), 'dev');
		await expect(prepare({ env: RELEASE })).rejects.toThrow(/different namespaces/);

		fakeBinary(path.join(root, 'linux-arm', 'anytype-mcp'), 'release', 7);
		await expect(prepare({ env: RELEASE })).rejects.toThrow(/different revisions/);
	});

	test('S10: the universal forwarder is joined only from two release-namespace slices — a dev Intel slice fails before lipo and codesign', async () => {
		fakeBinary(path.join(root, 'darwin-arm', 'anytype-mcp'), 'release');
		fakeBinary(path.join(root, 'darwin-amd', 'anytype-mcp'), 'dev');
		await expect(prepare({ platform: 'darwin', arch: 'arm64', env: RELEASE })).rejects.toThrow(/release-namespace forwarder for both architectures: darwin-amd/);
		// lipo never wrote its output, so nothing was there to sign
		expect(fs.existsSync(path.join(root, 'dist', 'anytype-mcp'))).toBe(false);

		// The other way round fails the same way
		fakeBinary(path.join(root, 'darwin-arm', 'anytype-mcp'), 'dev');
		fakeBinary(path.join(root, 'darwin-amd', 'anytype-mcp'), 'release');
		await expect(prepare({ platform: 'darwin', arch: 'arm64', env: RELEASE })).rejects.toThrow(/both architectures: darwin-arm/);
		expect(fs.existsSync(path.join(root, 'dist', 'anytype-mcp'))).toBe(false);
	});

	test('D1-07: forwarder fixtures (rev 5; a universal file with one rev 5 slice) — a release build fails in prepare-forwarder.js, a development build has the stdio routes off', async () => {
		const notes = () => vi.mocked(console.log).mock.calls.map(c => c.join(' ')).join('\n');
		const dist = path.join(root, 'dist', 'anytype-mcp');

		expect(prepareForwarder.MIN_FORWARDER_REV).toBe(6);

		// Rev 5, release: Linux and Windows fail before anything is signed
		fakeBinary(path.join(root, 'linux-amd', 'anytype-mcp'), 'release', 5);
		await expect(prepare({ env: RELEASE })).rejects.toThrow(/revision 5, this desktop needs at least 6/);
		fakeBinary(path.join(root, 'dist', 'anytype-mcp.exe'), 'release', 5);
		await expect(prepare({ platform: 'win32', env: RELEASE, signHook: async () => { throw new Error('never signed'); } })).rejects.toThrow(/revision 5/);
		// No marker at all is no revision
		fakeBinary(path.join(root, 'linux-amd', 'anytype-mcp'), 'release', 6, 'release', '');
		await expect(prepare({ env: RELEASE })).rejects.toThrow(/no revision marker/);

		// Rev 5, development: no forwarder in the build, with a note
		fakeBinary(dist, 'dev', 5);
		expect(await prepare()).toBeNull();
		expect(notes()).toMatch(/revision 5, this desktop needs at least 6: not used by this development build \(the stdio routes are off\)/);
		fakeBinary(dist, 'dev', 6, 'dev', '');
		expect(await prepare()).toBeNull();

		// macOS release: each slice is read before lipo — one rev 5 slice fails, and no universal file is written
		fs.rmSync(dist, { force: true });
		fakeBinary(path.join(root, 'darwin-arm', 'anytype-mcp'), 'release', 6);
		fakeBinary(path.join(root, 'darwin-amd', 'anytype-mcp'), 'release', 5);
		await expect(prepare({ platform: 'darwin', arch: 'arm64', env: RELEASE })).rejects.toThrow(/one forwarder revision: the forwarder files have different revisions/);
		expect(fs.existsSync(dist)).toBe(false);

		// A universal file with one rev 5 slice (a locally built one): every slice counts, the development build has no forwarder
		const local = path.join(dir, 'built', 'anytype-mcp');

		fatFile(local, [ '# anytype-mcp-rev:6', '# anytype-mcp-rev:5' ]);
		expect(await prepare({ platform: 'darwin', env: { ANYTYPE_MCP_BIN: local } })).toBeNull();
		// Both slices at 6 pass the revision check (this text file can't answer `version --json`, which is asked next)
		fatFile(local, [ '# anytype-mcp-rev:6', '# anytype-mcp-rev:6' ]);
		await expect(prepare({ platform: 'darwin', env: { ANYTYPE_MCP_BIN: local } })).rejects.toThrow(/does not agree/);
		// A release slice joined with a development one is two namespaces: the development build has no forwarder (D1B-04)
		fatFile(local, [ '# anytype-mcp-rev:6 anytype-mcp-namespace:release', '# anytype-mcp-rev:6' ]);
		expect(await prepare({ platform: 'darwin', env: { ANYTYPE_MCP_BIN: local } })).toBeNull();
		expect(notes()).toMatch(/different namespaces: not used by this development build \(the stdio routes are off/);
	});

	test('D1R1-B: mixed namespaces fail a release build, but a development build goes on without a forwarder (the staged copy removed)', async () => {
		const notes = () => vi.mocked(console.log).mock.calls.map(c => c.join(' ')).join('\n');
		const dist = path.join(root, 'dist', 'anytype-mcp');
		const local = path.join(dir, 'built', 'anytype-mcp');

		// A locally built universal file of a release slice and a development one
		fatFile(local, [ '# anytype-mcp-rev:6 anytype-mcp-namespace:release', '# anytype-mcp-rev:6' ]);
		expect(await prepare({ platform: 'darwin', env: { ANYTYPE_MCP_BIN: local } })).toBeNull();
		expect(notes()).toMatch(/the forwarder has slices of different namespaces: not used by this development build \(the stdio routes are off\); dist\/anytype-mcp removed/);
		expect(fs.existsSync(dist)).toBe(false);
		expect(fs.existsSync(local)).toBe(true);

		// The release flavour still fails
		fakeBinary(path.join(root, 'linux-amd', 'anytype-mcp'), 'release');
		fakeBinary(path.join(root, 'linux-arm', 'anytype-mcp'), 'dev');
		await expect(prepare({ env: RELEASE })).rejects.toThrow(/different namespaces/);
	});

	test('Q11: a failed AzureSignTool run prints and throws no credential — through the hook and through prepare()', async () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const hook = require('../../../hook/sign.js');
		const sign = hook.default;
		const original = hook.runner;
		const SENTINEL = 'SENTINEL-azure-client-secret-0123456789';
		const before = { secret: process.env.AZURE_CLIENT_SECRET, skip: process.env.ELECTRON_SKIP_NOTARIZE };
		const logged: string[] = [];

		vi.mocked(console.log).mockImplementation((...args: any[]) => {
			logged.push(args.map(String).join(' '));
		});
		process.env.AZURE_CLIENT_SECRET = SENTINEL;
		delete process.env.ELECTRON_SKIP_NOTARIZE;
		try {
			// The tool fails and echoes its own command line, secret included
			const failing = async (file: string, args: string[]) => ({ code: 3, stdout: `usage: ${args.join(' ')}`, stderr: `bad secret ${SENTINEL}` });
			let message = '';

			hook.runner = failing;
			expect(JSON.stringify(await failing('x', [ '--azure-key-vault-client-secret', SENTINEL ]))).toContain(SENTINEL);
			try {
				await sign({ path: 'C:\\b\\dist\\anytype-mcp.exe', site: 'https://anytype.io', forwarder: true });
			} catch (e) {
				message = String(e?.stack || e);
			};
			expect(message).toContain('AzureSignTool failed (exit 3)');

			// The same through prepare(): the release flavour on Windows calls the hook, and rethrows only its message
			fakeBinary(path.join(root, 'dist', 'anytype-mcp.exe'), 'release');

			let viaPrepare = '';

			try {
				await prepare({ platform: 'win32', env: { FORWARDER_SIGN_REQUIRED: '1' }, signHook: (ctx: any) => sign(ctx) });
			} catch (e) {
				viaPrepare = String(e?.stack || e);
			};
			expect(viaPrepare).toContain('could not be signed: AzureSignTool failed (exit 3)');
			expect(message + viaPrepare + logged.join('\n')).not.toContain(SENTINEL);
			expect(logged.join('\n')).toContain('***');
		} finally {
			hook.runner = original;
			for (const [ k, v ] of [ [ 'AZURE_CLIENT_SECRET', before.secret ], [ 'ELECTRON_SKIP_NOTARIZE', before.skip ] ] as const) {
				if (v === undefined) {
					delete process.env[k];
				} else {
					process.env[k] = v;
				};
			};
		};
	});

	test('Q13: the Windows forwarder must be signed by exactly our publisher — a valid signature of another one fails, in the verifier and in prepare()', async () => {
		const OURS = 'CN=Any Association, O=Any Association, C=CH';
		const check = (answer: string) => () => verifier.verifyWindowsSignature('C:\\x\\anytype-mcp.exe', () => answer, OURS);

		expect(check(`Valid|True|${OURS}`)).not.toThrow();
		expect(check('Valid|True|CN=Other')).toThrow(/another publisher/);
		expect(check(`Valid|True|${OURS}, OU=x`)).toThrow(/another publisher/);
		expect(check(`Valid|False|${OURS}`)).toThrow(/not valid and timestamped/);
		expect(check(`NotSigned||`)).toThrow(/not valid and timestamped/);
		// Without the constant nothing can be compared: fails closed
		expect(() => verifier.verifyWindowsSignature('x', () => `Valid|True|${OURS}`, '')).toThrow(/WIN_PUBLISHER_SUBJECT/);

		fakeBinary(path.join(root, 'dist', 'anytype-mcp.exe'), 'release');

		const signed = (subject: string) => prepare({ platform: 'win32', env: { FORWARDER_SIGN_REQUIRED: '1' }, signHook: async () => {}, winSignature: () => `Valid|True|${subject}`, winPublisher: OURS });

		expect(await signed(OURS)).toMatchObject({ signed: true, namespace: 'release', files: { 'win32-x64': path.join(root, 'dist', 'anytype-mcp.exe') } });
		await expect(signed('CN=Other')).rejects.toThrow(/could not be signed: .*another publisher/);
	});
});

describe.skipIf(!posix)('the packaged app verifies against its own metadata (clean and incremental builds)', () => {
	/** Packs what electron-builder would: the metadata inside app.asar, the forwarder and dist/mcp unpacked */
	const pack = async (platform: 'darwin' | 'linux' | 'win32', over: Record<string, any> = {}) => {
		const exe = (platform == 'win32') ? 'anytype-mcp.exe' : 'anytype-mcp';
		const key = (platform == 'darwin') ? 'darwin' : ((platform == 'win32') ? 'win32-x64' : 'linux-x64');
		const fwd = path.join(dir, 'build', exe);
		const metaFile = path.join(dir, 'app', 'electron', 'json', 'aiConnect.build.json');
		const appDir = (platform == 'darwin') ? path.join(dir, 'out', 'Anytype.app') : path.join(dir, 'out', 'unpacked');
		const resources = (platform == 'darwin') ? path.join(appDir, 'Contents', 'Resources') : path.join(appDir, 'resources');
		const unpacked = path.join(resources, 'app.asar.unpacked');

		// Every slice names the build's revision (`marker`: another one); `bytes` makes another forwarder of the same revision
		const marker = over.marker ?? `anytype-mcp-rev:${over.rev || 6}`;

		fs.mkdirSync(path.dirname(fwd), { recursive: true });
		if ((platform == 'darwin') && (process.platform == 'darwin')) {
			// A real universal Mach-O that exits 0: the verifier asks lipo for the package's architecture (Q9) and starts it (the smoke)
			fs.rmSync(fwd, { force: true });
			if (over.machO) {
				fs.copyFileSync(over.machO, fwd);
				fs.appendFileSync(fwd, `${marker}${over.bytes || ''}`);
			} else {
				const archs = execFileSync('/usr/bin/lipo', [ '-archs', '/usr/bin/true' ], { encoding: 'utf8' }).trim().split(/\s+/);
				const slices = archs.map(a => {
					const slice = path.join(dir, `true-${a}`);

					execFileSync('/usr/bin/lipo', [ '/usr/bin/true', '-thin', a, '-output', slice ], { stdio: 'pipe' });
					fs.appendFileSync(slice, `${marker}${over.bytes || ''}`);
					return slice;
				});

				execFileSync('/usr/bin/lipo', [ '-create', '-output', fwd, ...slices ], { stdio: 'pipe' });
			};
			fs.chmodSync(fwd, 0o755);
		} else {
			fs.writeFileSync(fwd, `FORWARDER-BYTES ${marker} ${over.bytes || ''}`, { mode: 0o755 });
		};
		fs.rmSync(path.join(dir, 'out'), { recursive: true, force: true });
		fs.writeFileSync(path.join(dir, 'app.js'), '');

		const meta = await buildMcp.build({
			outDir: path.join(dir, 'mcp'), metaFile, platform, env: {},
			forwarder: (over.forwarder !== undefined) ? over.forwarder : { signed: false, namespace: 'dev', rev: over.rev || 6, files: { [key]: fwd }, bundleFile: (platform == 'linux') ? null : fwd },
		});

		// A bundle whose manifest someone changed after the build: the metadata follows it, so only the manifest checks can tell
		if (over.manifest && meta.mcpb) {
			const file = path.join(dir, 'mcp', 'Anytype.mcpb');
			const zip = await JSZip.loadAsync(fs.readFileSync(file));
			const manifest = JSON.parse(await zip.file('manifest.json').async('string'));

			over.manifest(manifest);
			zip.file('manifest.json', JSON.stringify(manifest, null, 2), { binary: true });
			fs.writeFileSync(file, await zip.generateAsync({ type: 'nodebuffer', compression: 'STORE', platform: 'UNIX' }));
			meta.mcpb.sha256 = sha(fs.readFileSync(file));
			fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));
		};

		fs.mkdirSync(path.join(unpacked, 'dist'), { recursive: true });
		await asar.createPackage(path.join(dir, 'app'), path.join(resources, 'app.asar'));
		fs.cpSync(path.join(dir, 'mcp'), path.join(unpacked, 'dist', 'mcp'), { recursive: true });
		if (over.forwarder !== null) {
			fs.copyFileSync(fwd, path.join(unpacked, 'dist', exe));
		};
		return { appDir, unpacked, exe, meta, arch: 'x64' };
	};
	// A macOS package is the x64 one unless a test names another: on Apple Silicon its smoke runs through Rosetta (as in
	// the release build), because the system binaries the stand-ins are cut from have arm64e slices, not arm64
	const verify = (p: { appDir: string }, platform: string, over: Record<string, any> = {}) => verifier.verify({ appDir: p.appDir, platform, arch: 'x64', ...over });

	/** The bundle the build packs around `file` as the macOS forwarder */
	const bundleOf = async (name: string, file: string) => {
		await buildMcp.build({
			outDir: path.join(dir, name), metaFile: path.join(dir, `${name}.json`), platform: 'darwin', env: {},
			forwarder: { signed: false, namespace: 'dev', rev: 6, files: { darwin: file }, bundleFile: file },
		});

		const zip = await JSZip.loadAsync(fs.readFileSync(path.join(dir, name, 'Anytype.mcpb')));
		return { zip, manifest: JSON.parse(await zip.file('manifest.json').async('string')) };
	};

	/** …around a shell stand-in for the forwarder (`lines` after its shebang and revision marker) */
	const scriptBundle = (name: string, lines: string[]) => {
		const script = path.join(dir, 'build', name);

		fs.mkdirSync(path.dirname(script), { recursive: true });
		fs.writeFileSync(script, [ '#!/bin/sh', '# anytype-mcp-rev:6', ...lines, '' ].join('\n'), { mode: 0o755 });
		return bundleOf(name, script);
	};

	test.each([ 'darwin', 'win32', 'linux' ] as const)('%s: a clean build verifies; so does a rebuild with another forwarder (the metadata follows)', async platform => {
		const first = await pack(platform);

		expect(await verify(first, platform)).toBe('verified');

		const second = await pack(platform, { bytes: 'FORWARDER-BYTES-REV-7', rev: 7 });

		expect(second.meta.forwarder.sha256).not.toEqual(first.meta.forwarder.sha256);
		expect(await verify(second, platform)).toBe('verified');
		if (platform != 'linux') {
			expect(second.meta.mcpb.version).toBe('2.7.0');
		} else {
			expect(second.meta.mcpb).toBeNull();
			expect(fs.existsSync(path.join(second.unpacked, 'dist', 'mcp', 'Anytype.mcpb'))).toBe(false);
		};
	});

	test('the metadata is read from inside app.asar', async () => {
		const p = await pack('linux');

		expect(JSON.parse(asar.extractFile(path.join(p.appDir, 'resources', 'app.asar'), path.join('electron', 'json', 'aiConnect.build.json')).toString())).toEqual(p.meta);
		expect(fs.existsSync(path.join(p.unpacked, 'electron'))).toBe(false);
	});

	test('S2 / S4: a forwarder that packaging signed or rewrote no longer matches, and the build fails', async () => {
		const p = await pack('darwin');

		fs.appendFileSync(path.join(p.unpacked, 'dist', p.exe), 'resigned');
		await expect(verify(p, 'darwin')).rejects.toThrow(/differs from the one the metadata describes/);
	});

	test('a bundle that isn\'t the one built, or whose forwarder isn\'t the packaged one, fails', async () => {
		const p = await pack('darwin');
		const bundle = path.join(p.unpacked, 'dist', 'mcp', 'Anytype.mcpb');
		const good = fs.readFileSync(bundle);

		fs.writeFileSync(bundle, Buffer.concat([ good, Buffer.from('x') ]));
		await expect(verify(p, 'darwin')).rejects.toThrow(/Anytype\.mcpb differs/);
		fs.rmSync(bundle);
		await expect(verify(p, 'darwin')).rejects.toThrow(/no Anytype\.mcpb/);
		expect(p.meta.mcpb).not.toBeNull();
	});

	test('D1-08: packed manifest fixtures (the old `serve --connection claude-desktop`, a tier field, the key in args, a wrong env name) fail verify-forwarder.js; the good bundle passes the resolved-launch smoke', async () => {
		const fixtures: [ string, (m: any) => void ][] = [
			[ 'the old args', m => { m.server.mcp_config.args = [ 'serve', '--connection', 'claude-desktop' ]; } ],
			[ 'a tier field', m => { m.user_config.tier = { type: 'string', title: 'Tool set', default: 'small', required: false }; } ],
			[ 'the key in args', m => { m.server.mcp_config.args = [ 'serve', '--tier', 'full', '--key', '${user_config.api_key}' ]; } ],
			[ 'a wrong env name', m => { m.server.mcp_config.env = { ANYTYPE_KEY: '${user_config.api_key}', ANYTYPE_MCP_FILES_DIR: '${user_config.files_dir}' }; } ],
			[ 'a platform override', m => { m.server.mcp_config.platform_overrides = { darwin: { args: [ 'serve', '--tier', 'small' ] } }; } ],
		];

		for (const [ name, edit ] of fixtures) {
			const p = await pack('darwin', { manifest: edit });

			await expect(verify(p, 'darwin'), name).rejects.toThrow(/Anytype\.mcpb's manifest/);
		};
		expect(await verify(await pack('darwin'), 'darwin')).toBe('verified');

		// The smoke on the bundle the build packs: unpacked with its own modes, resolved by the pinned MCPB resolver with only
		// the key filled in, started with stdin closed. This stand-in exits 0 only for exactly `serve --tier full`, a
		// substituted key and the folder for files left unset (the literal the forwarder ignores)
		const script = path.join(dir, 'build', 'script-forwarder');

		fs.mkdirSync(path.dirname(script), { recursive: true });
		fs.writeFileSync(script, [
			'#!/bin/sh',
			'# anytype-mcp-rev:6',
			'[ "$#" = 3 ] && [ "$1 $2 $3" = "serve --tier full" ] || exit 3',
			'case "$ANYTYPE_API_KEY" in "" | *user_config*) exit 4 ;; esac',
			'[ "$ANYTYPE_MCP_FILES_DIR" = \'${user_config.files_dir}\' ] || exit 5',
			'cat > /dev/null',
			'exit 0',
			'',
		].join('\n'), { mode: 0o755 });
		await buildMcp.build({
			outDir: path.join(dir, 'smoke'), metaFile: path.join(dir, 'smoke.json'), platform: 'darwin', env: {},
			forwarder: { signed: false, namespace: 'dev', rev: 6, files: { darwin: script }, bundleFile: script },
		});

		const zip = await JSZip.loadAsync(fs.readFileSync(path.join(dir, 'smoke', 'Anytype.mcpb')));
		const manifest = JSON.parse(await zip.file('manifest.json').async('string'));
		const withArgs = (args: string[]) => ({ ...manifest, server: { ...manifest.server, mcp_config: { ...manifest.server.mcp_config, args } } });

		expect(() => verifier.verifyManifest(manifest, 'anytype-mcp')).not.toThrow();
		await expect(verifier.smoke(zip, manifest)).resolves.toBeUndefined();
		await expect(verifier.smoke(zip, withArgs([ 'serve', '--tier', 'full', '${user_config.api_key}' ]))).rejects.toThrow(/did not end with exit 0 \(exit 3\)/);
		// Without the key Claude starts nothing at all
		await expect(verifier.smoke(zip, { ...manifest, user_config: { ...manifest.user_config, other: { type: 'string', title: 'x', required: true } } })).rejects.toThrow(/no launch/);
		// A binary that lost its Unix mode in the archive can't be started
		zip.file('server/anytype-mcp', fs.readFileSync(script), { binary: true, unixPermissions: 0o100644 });
		await expect(verifier.smoke(zip, manifest)).rejects.toThrow(/did not end with exit 0/);
	});

	test('D1R1-B: (D1B-01, a residual of Claude\'s resolver) a plain folder for files reaches the forwarder unchanged and the smoke checks it; `$\'` / `$$` in its name are rewritten by MCPB', async () => {
		const { zip, manifest } = await scriptBundle('folder-forwarder', [ 'exit 0' ]);
		const resolve = await verifier.mcpbResolver();
		const folderOf = async (files_dir: string) => (await resolve({ manifest, extensionPath: '/ext', systemDirs: {}, userConfig: { api_key: 'k', files_dir }, pathSeparator: '/' })).env.ANYTYPE_MCP_FILES_DIR;

		for (const plain of [ '/Users/me/Claude files (1)', 'C:\\Users\\me\\Claude files', '/Users/me/$1 $HOME ${x}' ]) {
			expect(await folderOf(plain)).toBe(plain);
		};
		// The pinned resolver hands the value to String.replace as the replacement string. Only MCPB can fix this: the
		// forwarder can't know what was picked (it refuses the home folder and every folder around it whatever the spelling)
		expect(await folderOf('/Review/backup/$\'')).toBe('/Review/backup/');
		expect(await folderOf('C:\\Review\\Budget$$')).toBe('C:\\Review\\Budget$');
		expect(await folderOf('/Review/$&')).toBe('/Review/${user_config.files_dir}');

		// The smoke fails a mapping that doesn't pass a plain folder through as it is
		const env = { ...manifest.server.mcp_config.env, ANYTYPE_MCP_FILES_DIR: '${user_config.files_dir}/x' };

		await expect(verifier.smoke(zip, manifest)).resolves.toBeUndefined();
		await expect(verifier.smoke(zip, { ...manifest, server: { ...manifest.server, mcp_config: { ...manifest.server.mcp_config, env } } })).rejects.toThrow(/plain folder for files/);
	});

	test.skipIf(process.platform != 'darwin')('Q9: a thin forwarder of the other architecture fails the package it doesn\'t fit (a two-arch local build)', async () => {
		const thin = path.join(dir, 'thin-x64');

		// The system binary's Intel slice alone
		execFileSync('/usr/bin/lipo', [ '/usr/bin/true', '-thin', 'x86_64', '-output', thin ], { stdio: 'pipe' });

		const p = await pack('darwin', { machO: thin });

		expect(await verify(p, 'darwin', { arch: 'x64' })).toBe('verified');
		await expect(verify(p, 'darwin', { arch: 'arm64' })).rejects.toThrow(/no arm64 slice/);
	});

	test.skipIf(process.platform != 'darwin')('D1R1-B: an x64 package is smoked under arch -x86_64 — each package starts its own slice of the universal forwarder, not the runner\'s', async () => {
		const arm = execFileSync('/usr/bin/lipo', [ '-archs', '/usr/bin/true' ], { encoding: 'utf8' }).trim().split(/\s+/).find(a => a.startsWith('arm64'));
		const slice = (src: string, a: string) => {
			const out = path.join(dir, `${path.basename(src)}-${a}`);

			execFileSync('/usr/bin/lipo', [ src, '-thin', a, '-output', out ], { stdio: 'pipe' });
			fs.appendFileSync(out, 'anytype-mcp-rev:6');
			return out;
		};
		// A copy of /usr/bin/true's slice exits 0; a copy of /usr/bin/false's never does (it exits 1, or the system kills it)
		const universal = (intel: string, apple: string) => {
			const out = path.join(dir, `universal-${path.basename(intel)}-${path.basename(apple)}`);

			execFileSync('/usr/bin/lipo', [ '-create', '-output', out, slice(intel, 'x86_64'), slice(apple, arm) ], { stdio: 'pipe' });
			return out;
		};
		const badIntel = universal('/usr/bin/false', '/usr/bin/true');
		const badApple = universal('/usr/bin/true', '/usr/bin/false');

		// The x64 package starts the Intel slice — also on Apple Silicon (through Rosetta), where its smoke used to be skipped
		await expect(verify(await pack('darwin', { machO: badIntel, marker: '' }), 'darwin', { arch: 'x64' })).rejects.toThrow(/the bundle's own launch \(x86_64\) did not end with exit 0/);
		expect(await verify(await pack('darwin', { machO: badApple, marker: '' }), 'darwin', { arch: 'x64' })).toBe('verified');

		// The arm64 package's smoke starts the arm64 slice (only Apple Silicon can)
		if (process.arch == 'arm64') {
			const apple = await bundleOf('bad-apple', badApple);
			const intel = await bundleOf('bad-intel', badIntel);

			await expect(verifier.smoke(apple.zip, apple.manifest, { arch: 'arm64' })).rejects.toThrow(/\(arm64\) did not end with exit 0/);
			await expect(verifier.smoke(intel.zip, intel.manifest, { arch: 'arm64' })).resolves.toBeUndefined();
		};
	});

	test('D1R1-B: the smoke gives the forwarder its own temp folder (TMPDIR, TMP, TEMP) and removes what it made there', async () => {
		const report = path.join(dir, 'smoke-tmp.txt');
		const { zip, manifest } = await scriptBundle('tmp-forwarder', [
			'[ -n "$TMPDIR" ] && [ "$TMP" = "$TMPDIR" ] && [ "$TEMP" = "$TMPDIR" ] || exit 7',
			// What the real forwarder makes for its file tools when no folder is given
			'mkdir "$TMPDIR/anytype-mcp-files-0123456789abcdef" || exit 8',
			`printf '%s' "$TMPDIR" > '${report}'`,
			'exit 0',
		]);
		const before = fs.readdirSync(os.tmpdir()).filter(f => f.startsWith('anytype-mcp-files-'));

		await expect(verifier.smoke(zip, manifest)).resolves.toBeUndefined();

		const tmp = fs.readFileSync(report, 'utf8');

		expect(path.basename(path.dirname(tmp))).toMatch(/^anytype-mcpb-smoke-/);
		expect(fs.existsSync(path.dirname(tmp))).toBe(false);
		expect(fs.readdirSync(os.tmpdir()).filter(f => f.startsWith('anytype-mcp-files-'))).toEqual(before);
	});

	test('D1R1-B: a development build drops the forwarder it turns down from dist/ (never ANYTYPE_MCP_BIN itself); a package with `forwarder: null` that ships one fails', async () => {
		const prepare = (env: Record<string, string> = {}) => prepareForwarder.prepare({ rootDir: root, env, platform: 'linux', arch: 'x64' });
		const dist = path.join(root, 'dist', 'anytype-mcp');
		const local = path.join(dir, 'built', 'anytype-mcp');

		// update.sh's copy: rev 5, then a release-namespace one
		fakeBinary(dist, 'dev', 5);
		expect(await prepare()).toBeNull();
		expect(fs.existsSync(dist)).toBe(false);
		fakeBinary(dist, 'release');
		expect(await prepare()).toBeNull();
		expect(fs.existsSync(dist)).toBe(false);
		// ANYTYPE_MCP_BIN: the copy in dist/ goes, the caller's file stays — also when it is dist/anytype-mcp in another spelling
		fakeBinary(local, 'dev', 5);
		expect(await prepare({ ANYTYPE_MCP_BIN: local })).toBeNull();
		expect(fs.existsSync(dist)).toBe(false);
		expect(fs.existsSync(local)).toBe(true);
		fakeBinary(dist, 'dev', 5);
		expect(await prepare({ ANYTYPE_MCP_BIN: `${root}/dist/./anytype-mcp` })).toBeNull();
		expect(fs.existsSync(dist)).toBe(true);
		// A forwarder the build uses stays
		fakeBinary(dist, 'dev', 6);
		expect(await prepare()).toMatchObject({ rev: 6 });
		expect(fs.existsSync(dist)).toBe(true);

		// The packaged-app check: the metadata says none, the package has one anyway (any OS, either name)
		for (const platform of [ 'linux', 'darwin', 'win32' ] as const) {
			const none = await pack(platform, { forwarder: null });

			expect(await verify(none, platform)).toBe('none');
			fs.copyFileSync(path.join(dir, 'build', none.exe), path.join(none.unpacked, 'dist', none.exe));
			await expect(verify(none, platform), platform).rejects.toThrow(/the metadata says this build has no forwarder, but the package ships dist\/anytype-mcp/);
		};
	});

	test('Q9: Linux is gated in afterPack, before Sentry and before any artifact — a package that fails the check rejects', async () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const afterPack = require('../../../hook/afterpack.js').default;
		const skip = process.env.ELECTRON_SKIP_SENTRY;
		const p = await pack('linux');
		const context = (electronPlatformName: string) => ({ electronPlatformName, appOutDir: p.appDir, arch: 1, packager: { appInfo: { productFilename: 'Anytype', version: '0.0.0' } } });

		process.env.ELECTRON_SKIP_SENTRY = '1';
		try {
			await expect(afterPack(context('linux'))).resolves.toBeUndefined();
			fs.appendFileSync(path.join(p.unpacked, 'dist', p.exe), 'rewritten');
			await expect(afterPack(context('linux'))).rejects.toThrow(/differs from the one the metadata describes/);
			// macOS and Windows are checked in afterSign, after their signing: not here
			await expect(afterPack(context('darwin'))).resolves.toBeUndefined();
			await expect(verifier.verifyLinux(context('linux'), async () => { throw new Error('refused'); })).rejects.toThrow('refused');
		} finally {
			if (skip === undefined) {
				delete process.env.ELECTRON_SKIP_SENTRY;
			} else {
				process.env.ELECTRON_SKIP_SENTRY = skip;
			};
		};
	});

	test('Q12: a build without a bundle verifies unless the bundle is required (a release); a stray bundle the metadata doesn\'t describe fails', async () => {
		const fwd = path.join(dir, 'build', 'anytype-mcp.exe');
		const p = await pack('win32', { forwarder: { signed: false, namespace: 'dev', rev: 6, files: { 'win32-x64': fwd }, bundleFile: null } });

		expect(p.meta.mcpb).toBeNull();
		expect(await verify(p, 'win32')).toBe('verified');
		await expect(verify(p, 'win32', { requireBundle: true })).rejects.toThrow(/no Anytype\.mcpb/);
		fs.writeFileSync(path.join(p.unpacked, 'dist', 'mcp', 'Anytype.mcpb'), 'stray');
		await expect(verify(p, 'win32')).rejects.toThrow(/does not describe/);
	});

	test('no script of the Node connector may be packaged under dist/mcp', async () => {
		const p = await pack('linux');

		fs.writeFileSync(path.join(p.unpacked, 'dist', 'mcp', 'connect.mjs'), '');
		await expect(verify(p, 'linux')).rejects.toThrow(/script is packaged under dist\/mcp/);
	});

	test('release and nightly builds require a signed forwarder; a build without one is allowed only locally', async () => {
		const dev = await pack('linux');

		await expect(verify(dev, 'linux', { requireSigned: true })).rejects.toThrow(/must be signed/);

		const none = await pack('linux', { forwarder: null });

		expect(none.meta).toEqual({ signed: false, forwarder: null, mcpb: null });
		expect(await verify(none, 'linux')).toBe('none');
		await expect(verify(none, 'linux', { requireSigned: true })).rejects.toThrow();

		// Linux release: signed means the release namespace; both must agree
		const fwd = path.join(dir, 'build', 'anytype-mcp');
		const release = await pack('linux', { forwarder: { signed: true, namespace: 'release', rev: 6, files: { 'linux-x64': fwd }, bundleFile: null } });

		expect(await verify(release, 'linux', { requireSigned: true })).toBe('verified');
		await expect(verify(release, 'linux', { requireSigned: true, arch: 'arm64' })).rejects.toThrow(/no forwarder entry for linux-arm64/);
	});

	test('S14: a local two-arch dist:linux with one development forwarder builds — the other architecture\'s package has none; a release still fails', async () => {
		const dev = await pack('linux');

		expect(Object.keys(dev.meta.forwarder.sha256)).toEqual([ 'linux-x64' ]);
		expect(await verify(dev, 'linux')).toBe('verified');
		expect(await verify(dev, 'linux', { arch: 'arm64' })).toBe('none');
		await expect(verify(dev, 'linux', { arch: 'arm64', requireSigned: true })).rejects.toThrow();
		// Only Linux: a macOS / Windows package without its entry still fails
		await expect(verify(dev, 'win32')).rejects.toThrow(/no forwarder entry for win32-x64/);
	});

	test.skipIf(process.platform != 'darwin')('macOS signature checks on a real Mach-O: the identifier, the hardened runtime and no entitlements are read from codesign', () => {
		// A real executable, signed ad hoc here (no certificate needed): everything but the Team ID is as in CI
		const file = path.join(dir, 'true');
		const signAdHoc = (args: string[]) => execFileSync('/usr/bin/codesign', [ '--force', '--sign', '-', ...args, file ], { stdio: 'pipe' });

		fs.copyFileSync('/usr/bin/true', file);
		signAdHoc([ '--options', 'runtime', '--identifier', 'com.anytype.mcp' ]);
		// An ad-hoc signature has no Team ID: refused as the release forwarder
		expect(() => prepareForwarder.verifyMac(file)).toThrow(/no Team ID/);

		signAdHoc([ '--identifier', 'com.anytype.mcp' ]);
		expect(() => prepareForwarder.verifyMac(file)).toThrow(/hardened runtime/);

		signAdHoc([ '--options', 'runtime', '--identifier', 'com.example.other' ]);
		expect(() => prepareForwarder.verifyMac(file)).toThrow(/identifier is com\.example\.other/);

		// The packaged-app check reads the same fields (its designated requirement names the identifier only with a real certificate)
		signAdHoc([ '--options', 'runtime', '--identifier', 'com.anytype.mcp' ]);

		const info = execFileSync('/bin/sh', [ '-c', `/usr/bin/codesign -d --verbose=4 "${file}" 2>&1` ], { encoding: 'utf8' });

		expect(info).toMatch(/^Identifier=com\.anytype\.mcp$/m);
		expect(info).toMatch(/flags=0x[0-9a-f]+\(adhoc,runtime\)/);
		expect(execFileSync('/usr/bin/codesign', [ '-d', '--entitlements', '-', '--xml', file ], { encoding: 'utf8', stdio: [ 'ignore', 'pipe', 'ignore' ] }).trim()).toBe('');
	});
});
