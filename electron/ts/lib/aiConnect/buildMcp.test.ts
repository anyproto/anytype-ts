/**
 * scripts/build-mcp.js: the static Claude Desktop bundle (a binary bundle with the forwarder inside), its
 * manifest and signing, and the build's metadata file.
 */
import { execFileSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import JSZip from 'jszip';
import path from 'path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { tempDir } from './testEnv';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const buildMcp = require('../../../../scripts/build-mcp.js');

const ROOT = path.join(__dirname, '..', '..', '..', '..');

const hasOpenssl = (() => {
	try {
		execFileSync('openssl', [ 'version' ], { stdio: 'pipe' });
		return true;
	} catch (e) {
		return false;
	};
})();

/** Central-directory entries of a zip: name and compression method (0 = stored) */
const zipEntries = (buf: Buffer): { name: string; method: number; size: number; compressed: number }[] => {
	const eocd = buf.lastIndexOf(Buffer.from([ 0x50, 0x4b, 0x05, 0x06 ]));
	const count = buf.readUInt16LE(eocd + 10);
	const ret = [];
	let at = buf.readUInt32LE(eocd + 16);

	for (let i = 0; i < count; i++) {
		expect(buf.readUInt32LE(at)).toBe(0x02014b50);

		const method = buf.readUInt16LE(at + 10);
		const compressed = buf.readUInt32LE(at + 20);
		const size = buf.readUInt32LE(at + 24);
		const nameLen = buf.readUInt16LE(at + 28);
		const extraLen = buf.readUInt16LE(at + 30);
		const commentLen = buf.readUInt16LE(at + 32);

		ret.push({ name: buf.subarray(at + 46, at + 46 + nameLen).toString('utf8'), method, size, compressed });
		at += 46 + nameLen + extraLen + commentLen;
	};
	return ret;
};

const sha256 = (buf: Buffer) => crypto.createHash('sha256').update(buf).digest('hex');

let dir = '';
let fwd = '';
let metaFile = '';

/** What scripts/prepare-forwarder.js hands over: here a stand-in binary */
const forwarder = (over: Record<string, any> = {}) => ({ signed: false, namespace: 'dev', rev: 5, files: { darwin: fwd }, bundleFile: fwd, ...over });

/** A build into the temp folder, never into the repo's dist/ or electron/json */
const build = (over: Record<string, any> = {}) => buildMcp.build({ outDir: path.join(dir, 'mcp'), metaFile, platform: 'darwin', env: {}, forwarder: forwarder(), ...over });

const readMeta = () => JSON.parse(fs.readFileSync(metaFile, 'utf8'));

beforeEach(() => {
	dir = tempDir('aic-mcpb-');
	fwd = path.join(dir, 'anytype-mcp');
	metaFile = path.join(dir, 'json', 'aiConnect.build.json');
	fs.writeFileSync(fwd, 'FORWARDER-BYTES', { mode: 0o755 });
});

afterEach(() => {
	fs.rmSync(dir, { recursive: true, force: true });
});

describe('build-mcp', () => {
	test('an unsigned build: files, stored entries, the binary manifest and the one metadata file', async () => {
		const out = path.join(dir, 'mcp');

		// Leftovers of an earlier build (the Node connector's scripts, the old metadata) never survive
		fs.mkdirSync(out, { recursive: true });
		fs.writeFileSync(path.join(out, 'cli.mjs'), 'old');
		fs.writeFileSync(path.join(out, 'mcpb.json'), '{}');

		const info = await build();
		const bundle = fs.readFileSync(path.join(out, 'Anytype.mcpb'));

		expect(fs.readdirSync(out).sort()).toEqual([ 'Anytype.mcpb', 'skill' ]);
		expect(fs.readdirSync(path.join(out, 'skill')).sort()).toEqual([ 'PREAMBLE.md', 'SKILL.md' ]);

		const entries = zipEntries(bundle);

		expect(entries.map(e => e.name)).toEqual([ 'manifest.json', 'server/anytype-mcp', 'icon.png' ]);
		expect(entries.every(e => (e.method == 0) && (e.size == e.compressed))).toBe(true);

		const zip = await JSZip.loadAsync(bundle);
		const manifest = JSON.parse(await zip.file('manifest.json').async('string'));

		// The binary inside is the forwarder's bytes, executable
		expect(await zip.file('server/anytype-mcp').async('nodebuffer')).toEqual(fs.readFileSync(fwd));
		expect((zip.file('server/anytype-mcp').unixPermissions as number) & 0o777).toBe(0o755);
		expect(manifest).toMatchObject({
			manifest_version: '0.3',
			name: 'anytype-dev',
			version: '2.5.0',
			author: { name: 'Anytype' },
			server: { type: 'binary', entry_point: 'server/anytype-mcp', mcp_config: { command: '${__dirname}/server/anytype-mcp', args: [ 'serve', '--connection', 'claude-desktop' ] } },
			tools_generated: true,
			compatibility: { platforms: [ 'darwin' ] },
		});
		expect(manifest.compatibility.runtimes).toBeUndefined();
		expect(JSON.stringify(manifest)).not.toMatch(/KEY|Bearer|env|node|\.mjs/);

		expect(readMeta()).toEqual({
			signed: false,
			forwarder: { rev: 5, namespace: 'dev', sha256: { darwin: sha256(fs.readFileSync(fwd)) } },
			mcpb: { sha256: sha256(bundle), version: '2.5.0' },
		});
		expect(info).toEqual(readMeta());
	});

	test('Windows: the payload is anytype-mcp.exe and the manifest names win32 only', async () => {
		const exe = path.join(dir, 'anytype-mcp.exe');

		fs.writeFileSync(exe, 'EXE-BYTES');

		const info = await build({ platform: 'win32', forwarder: forwarder({ files: { 'win32-x64': exe }, bundleFile: exe }) });
		const zip = await JSZip.loadAsync(fs.readFileSync(path.join(dir, 'mcp', 'Anytype.mcpb')));
		const manifest = JSON.parse(await zip.file('manifest.json').async('string'));

		expect(Object.keys(zip.files).sort()).toEqual([ 'icon.png', 'manifest.json', 'server/anytype-mcp.exe' ]);
		expect(manifest.server).toEqual({ type: 'binary', entry_point: 'server/anytype-mcp.exe', mcp_config: { command: '${__dirname}/server/anytype-mcp.exe', args: [ 'serve', '--connection', 'claude-desktop' ] } });
		expect(manifest.compatibility).toEqual({ platforms: [ 'win32' ] });
		expect(info.forwarder.sha256).toEqual({ 'win32-x64': sha256(fs.readFileSync(exe)) });
	});

	test('Linux: one hash per architecture and no bundle', async () => {
		const arm = path.join(dir, 'anytype-mcp-arm');

		fs.writeFileSync(arm, 'ARM-BYTES');

		const info = await build({ platform: 'linux', forwarder: forwarder({ signed: true, namespace: 'release', files: { 'linux-x64': fwd, 'linux-arm64': arm }, bundleFile: null }) });

		expect(info).toEqual({
			signed: true,
			forwarder: { rev: 5, namespace: 'release', sha256: { 'linux-x64': sha256(fs.readFileSync(fwd)), 'linux-arm64': sha256(fs.readFileSync(arm)) } },
			mcpb: null,
		});
		expect(fs.existsSync(path.join(dir, 'mcp', 'Anytype.mcpb'))).toBe(false);
	});

	test('no forwarder: metadata without one, no bundle, the skill still built', async () => {
		const info = await build({ forwarder: null });

		expect(info).toEqual({ signed: false, forwarder: null, mcpb: null });
		expect(fs.readdirSync(path.join(dir, 'mcp'))).toEqual([ 'skill' ]);
	});

	test('the bundle version follows the forwarder revision; a release build keeps the name anytype', async () => {
		const template = JSON.parse(fs.readFileSync(path.join(ROOT, 'electron', 'mcp', 'manifest.json'), 'utf8'));

		expect(buildMcp.manifestFor(template, { exe: 'anytype-mcp', platform: 'darwin', rev: 12, signed: true })).toMatchObject({ name: 'anytype', display_name: 'Anytype', version: '2.12.0' });
		expect(buildMcp.manifestFor(template, { exe: 'anytype-mcp', platform: 'darwin', rev: 12, signed: false })).toMatchObject({ name: 'anytype-dev', version: '2.12.0' });
		expect(template.server.type).toBe('binary');
	});

	test('Q12: a release-namespace build whose bundle can\'t be signed ships no bundle (a nightly without the secrets); with MCPB_SIGN_REQUIRED=1 (a release) it fails', async () => {
		const release = forwarder({ signed: true, namespace: 'release' });
		const info = await build({ forwarder: release });

		expect(info).toEqual({ signed: true, forwarder: { rev: 5, namespace: 'release', sha256: { darwin: sha256(fs.readFileSync(fwd)) } }, mcpb: null });
		expect(readMeta()).toEqual(info);
		expect(fs.readdirSync(path.join(dir, 'mcp'))).toEqual([ 'skill' ]);

		await expect(build({ forwarder: release, env: { MCPB_SIGN_REQUIRED: '1' } })).rejects.toThrow(/MCPB_SIGN_REQUIRED/);
		expect(fs.existsSync(metaFile)).toBe(false);
		expect(fs.existsSync(path.join(dir, 'mcp', 'Anytype.mcpb'))).toBe(false);
	});

	test('the archive is reproducible', async () => {
		const a = await build({ outDir: path.join(dir, 'a') });
		const b = await build({ outDir: path.join(dir, 'b') });

		expect(a.mcpb.sha256).toBe(b.mcpb.sha256);
	});

	test('MCPB_SIGN_REQUIRED=1 without a certificate fails and leaves no bundle', async () => {
		const out = path.join(dir, 'mcp');

		await expect(build({ env: { MCPB_SIGN_REQUIRED: '1' } })).rejects.toThrow(/MCPB_SIGN_REQUIRED/);
		expect(fs.existsSync(path.join(out, 'Anytype.mcpb'))).toBe(false);
		expect(fs.existsSync(metaFile)).toBe(false);
	});

	test('a failed rebuild over a previous build leaves neither the old metadata nor an archive', async () => {
		const out = path.join(dir, 'mcp');

		await build({ env: {} });
		expect(fs.existsSync(metaFile)).toBe(true);

		await expect(build({ env: { MCPB_SIGN_REQUIRED: '1' } })).rejects.toThrow();
		expect(fs.existsSync(metaFile)).toBe(false);
		expect(fs.existsSync(path.join(out, 'Anytype.mcpb'))).toBe(false);
		expect(fs.readdirSync(out).filter(n => n.endsWith('.tmp'))).toEqual([]);
	});

	test('only one of certificate and key fails', async () => {
		await expect(build({ env: { MCPB_SIGN_CERT: '/x.pem' } })).rejects.toThrow(/both/);
	});

	describe.skipIf(!hasOpenssl)('signing with a throwaway certificate', () => {
		let cert = '';
		let key = '';
		let fingerprint = '';

		beforeEach(() => {
			cert = path.join(dir, 'cert.pem');
			key = path.join(dir, 'key.pem');
			execFileSync('openssl', [ 'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert, '-days', '1', '-subj', '/CN=Anytype Test' ], { stdio: 'pipe' });
			fingerprint = new crypto.X509Certificate(fs.readFileSync(cert)).fingerprint256;
		});

		test('signed: true, the signer fingerprint and the final digest match; a flipped byte fails verification', async () => {
			const out = path.join(dir, 'mcp');
			const info = await build({ env: { MCPB_SIGN_CERT: cert, MCPB_SIGN_KEY: key, MCPB_SIGN_FINGERPRINT: fingerprint, MCPB_SIGN_REQUIRED: '1' } });
			const file = path.join(out, 'Anytype.mcpb');
			const bundle = fs.readFileSync(file);
			const expected = fingerprint.replace(/:/g, '').toLowerCase();

			// The bundle is signed; `signed` itself says whether the forwarder is a release one (here it isn't)
			expect(info.mcpb).toEqual({ sha256: sha256(bundle), signerFingerprint: expected, version: '2.5.0' });
			expect(info.signed).toBe(false);
			expect(readMeta()).toEqual(info);
			expect(buildMcp.verifySignedBundle(file)).toBe(expected);

			// The signature block is appended after the zip
			const parts = buildMcp.splitSigned(bundle);
			expect(zipEntries(parts.content).map(e => e.name)).toEqual([ 'manifest.json', 'server/anytype-mcp', 'icon.png' ]);

			// Flip one byte inside the archive part
			const tampered = Buffer.from(bundle);
			tampered[200] ^= 0x01;
			fs.writeFileSync(path.join(dir, 'tampered.mcpb'), tampered);
			expect(() => buildMcp.verifySignedBundle(path.join(dir, 'tampered.mcpb'))).toThrow(/verification failed/);

			// And one inside the signature
			const badSig = Buffer.from(bundle);
			badSig[bundle.length - 40] ^= 0x01;
			fs.writeFileSync(path.join(dir, 'badsig.mcpb'), badSig);
			expect(() => buildMcp.verifySignedBundle(path.join(dir, 'badsig.mcpb'))).toThrow();

			// An unsigned archive has no signature block at all
			expect(() => buildMcp.verifySignedBundle(path.join(dir, 'cert.pem'))).toThrow(/no signature block/);
		});

		test('Z14: a signed build logs that the signer was verified, never the fingerprint', async () => {
			const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
			const expected = fingerprint.replace(/:/g, '').toLowerCase();

			await build({ env: { MCPB_SIGN_CERT: cert, MCPB_SIGN_KEY: key, MCPB_SIGN_FINGERPRINT: fingerprint, MCPB_SIGN_REQUIRED: '1' } });

			const logged = JSON.stringify(spy.mock.calls);

			spy.mockRestore();
			expect(logged).toContain('signer verified');
			expect(logged).not.toContain(expected);
			expect(logged.toLowerCase()).not.toContain(fingerprint.toLowerCase());
		});

		test('A14: a signer mismatch fails without either fingerprint in the output, and leaves no bundle', async () => {
			const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
			const out = path.join(dir, 'mcp');
			const wrong = 'AB:'.repeat(31) + 'AB';
			const actual = fingerprint.replace(/:/g, '').toLowerCase();
			let message = '';

			try {
				await build({ env: { MCPB_SIGN_CERT: cert, MCPB_SIGN_KEY: key, MCPB_SIGN_FINGERPRINT: wrong, MCPB_SIGN_REQUIRED: '1' } });
			} catch (e) {
				message = String(e?.stack || e);
			};

			const output = (message + JSON.stringify(spy.mock.calls)).toLowerCase();

			spy.mockRestore();
			expect(message).toMatch(/does not match/);
			for (const fp of [ actual, wrong.toLowerCase(), wrong.replace(/:/g, '').toLowerCase(), fingerprint.toLowerCase() ]) {
				expect(output).not.toContain(fp);
			};
			expect(fs.existsSync(path.join(out, 'Anytype.mcpb'))).toBe(false);
		});

		test('a wrong MCPB_SIGN_FINGERPRINT fails the build', async () => {
			const out = path.join(dir, 'mcp');

			await expect(build({ env: { MCPB_SIGN_CERT: cert, MCPB_SIGN_KEY: key, MCPB_SIGN_FINGERPRINT: 'ab'.repeat(32) } })).rejects.toThrow(/does not match/);
			expect(fs.existsSync(path.join(out, 'Anytype.mcpb'))).toBe(false);
			expect(fs.existsSync(metaFile)).toBe(false);
		});

		test('a missing MCPB_SIGN_FINGERPRINT fails the build', async () => {
			await expect(build({ env: { MCPB_SIGN_CERT: cert, MCPB_SIGN_KEY: key } })).rejects.toThrow(/MCPB_SIGN_FINGERPRINT/);
		});
	});
});
