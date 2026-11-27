/**
 * scripts/prepare-forwarder.js (which binary a build ships, its namespace, when it must be signed) and
 * electron/hook/verify-forwarder.js (the packaged forwarder is the one the metadata and Anytype.mcpb
 * describe; anytype-mcp-plan §4.4, §4.5), on a package assembled in a temp folder.
 */
import { execFileSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
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

const posix = (process.platform != 'win32');
const sha = (buf: Buffer | string) => crypto.createHash('sha256').update(buf).digest('hex');

/** A stand-in for the Go binary: answers `version --json`; the release one carries the namespace marker in its bytes */
const fakeBinary = (file: string, namespace: 'dev' | 'release', rev = 5, claims = namespace) => {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, [
		'#!/bin/sh',
		(namespace == 'release') ? '# anytype-mcp-namespace:release' : '# a development build',
		`echo '${JSON.stringify({ version: 'test', commit: 'c', rev, namespace: claims, impl: 'go' })}'`,
		'',
	].join('\n'), { mode: 0o755 });
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
		expect(await prepare()).toEqual({ signed: false, namespace: 'dev', rev: 5, files: { 'linux-x64': path.join(root, 'dist', 'anytype-mcp') }, bundleFile: null });

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
			signed: true, namespace: 'release', rev: 5, bundleFile: null,
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

		fakeBinary(path.join(root, 'dist', 'anytype-mcp'), 'dev', 5, 'release');
		await expect(prepare()).rejects.toThrow(/does not agree/);

		fakeBinary(path.join(root, 'linux-amd', 'anytype-mcp'), 'release');
		fakeBinary(path.join(root, 'linux-arm', 'anytype-mcp'), 'dev');
		await expect(prepare({ env: RELEASE })).rejects.toThrow(/different namespaces/);

		fakeBinary(path.join(root, 'linux-arm', 'anytype-mcp'), 'release', 6);
		await expect(prepare({ env: RELEASE })).rejects.toThrow(/does not agree/);
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

		fs.mkdirSync(path.dirname(fwd), { recursive: true });
		if ((platform == 'darwin') && (process.platform == 'darwin')) {
			// A real universal Mach-O: the verifier asks lipo for the package's architecture (Q9)
			fs.copyFileSync(over.machO || (over.bytes ? '/usr/bin/false' : '/usr/bin/true'), fwd);
			fs.chmodSync(fwd, 0o755);
		} else {
			fs.writeFileSync(fwd, over.bytes || 'FORWARDER-BYTES', { mode: 0o755 });
		};
		fs.rmSync(path.join(dir, 'out'), { recursive: true, force: true });
		fs.writeFileSync(path.join(dir, 'app.js'), '');

		const meta = await buildMcp.build({
			outDir: path.join(dir, 'mcp'), metaFile, platform, env: {},
			forwarder: (over.forwarder !== undefined) ? over.forwarder : { signed: false, namespace: 'dev', rev: over.rev || 5, files: { [key]: fwd }, bundleFile: (platform == 'linux') ? null : fwd },
		});

		fs.mkdirSync(path.join(unpacked, 'dist'), { recursive: true });
		await asar.createPackage(path.join(dir, 'app'), path.join(resources, 'app.asar'));
		fs.cpSync(path.join(dir, 'mcp'), path.join(unpacked, 'dist', 'mcp'), { recursive: true });
		if (over.forwarder !== null) {
			fs.copyFileSync(fwd, path.join(unpacked, 'dist', exe));
		};
		return { appDir, unpacked, exe, meta, arch: 'x64' };
	};
	const verify = (p: { appDir: string }, platform: string, over: Record<string, any> = {}) => verifier.verify({ appDir: p.appDir, platform, arch: 'x64', ...over });

	test.each([ 'darwin', 'win32', 'linux' ] as const)('%s: a clean build verifies; so does a rebuild with another forwarder (the metadata follows)', async platform => {
		const first = await pack(platform);

		expect(await verify(first, platform)).toBe('verified');

		const second = await pack(platform, { bytes: 'FORWARDER-BYTES-REV-6', rev: 6 });

		expect(second.meta.forwarder.sha256).not.toEqual(first.meta.forwarder.sha256);
		expect(await verify(second, platform)).toBe('verified');
		if (platform != 'linux') {
			expect(second.meta.mcpb.version).toBe('2.6.0');
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

	test.skipIf(process.platform != 'darwin')('Q9: a thin forwarder of the other architecture fails the package it doesn\'t fit (a two-arch local build)', async () => {
		const thin = path.join(dir, 'thin-x64');

		// The system binary's Intel slice alone
		execFileSync('/usr/bin/lipo', [ '/usr/bin/true', '-thin', 'x86_64', '-output', thin ], { stdio: 'pipe' });

		const p = await pack('darwin', { machO: thin });

		expect(await verify(p, 'darwin', { arch: 'x64' })).toBe('verified');
		await expect(verify(p, 'darwin', { arch: 'arm64' })).rejects.toThrow(/no arm64 slice/);
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
		const p = await pack('win32', { forwarder: { signed: false, namespace: 'dev', rev: 5, files: { 'win32-x64': fwd }, bundleFile: null } });

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
		const release = await pack('linux', { forwarder: { signed: true, namespace: 'release', rev: 5, files: { 'linux-x64': fwd }, bundleFile: null } });

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
