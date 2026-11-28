/**
 * scripts/build-mcp.js: the static Claude Desktop bundle (a binary bundle with the forwarder inside), its
 * manifest and signing, and the build's metadata file.
 */
import crypto from 'crypto';
import fs from 'fs';
import JSZip from 'jszip';
import path from 'path';
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { tempDir } from './testEnv';
import { AZURE, LEAKS, SIGNING_ENV, SUBJECT, failWith, fakeAzure, rs256, testChainCheck, testPki, type TestPki } from './testSigning';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const buildMcp = require('../../../../scripts/build-mcp.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const verifier = require('../../../hook/verify-forwarder.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const signer = require('../../../../scripts/sign-mcpb-azure.js');

const ROOT = path.join(__dirname, '..', '..', '..', '..');

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
const forwarder = (over: Record<string, any> = {}) => ({ signed: false, namespace: 'dev', rev: 6, files: { darwin: fwd }, bundleFile: fwd, ...over });

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
			version: '2.6.0',
			author: { name: 'Anytype' },
			server: {
				type: 'binary', entry_point: 'server/anytype-mcp',
				mcp_config: {
					command: '${__dirname}/server/anytype-mcp', args: [ 'serve', '--tier', 'full' ],
					env: { ANYTYPE_API_KEY: '${user_config.api_key}', ANYTYPE_MCP_FILES_DIR: '${user_config.files_dir}' },
				},
			},
			user_config: {
				api_key: { type: 'string', title: 'Anytype key', sensitive: true, required: true },
				files_dir: { type: 'directory', title: 'Folder for files (optional)', required: false },
			},
			tools_generated: true,
			compatibility: { platforms: [ 'darwin' ] },
		});
		expect(Object.keys(manifest.user_config)).toEqual([ 'api_key', 'files_dir' ]);
		expect(manifest.compatibility.runtimes).toBeUndefined();
		// No key and no tier field: the key reaches the forwarder only through `env`, the tool set is always Full
		expect(JSON.stringify(manifest.server.mcp_config.args)).not.toMatch(/user_config|KEY|small|large/);
		expect(JSON.stringify(manifest)).not.toMatch(/Bearer|node|\.mjs|"tier"/);

		expect(readMeta()).toEqual({
			signed: false,
			forwarder: { rev: 6, namespace: 'dev', sha256: { darwin: sha256(fs.readFileSync(fwd)) } },
			mcpb: { sha256: sha256(bundle), version: '2.6.0' },
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
		expect(manifest.server).toEqual({
			type: 'binary', entry_point: 'server/anytype-mcp.exe',
			mcp_config: {
				command: '${__dirname}/server/anytype-mcp.exe', args: [ 'serve', '--tier', 'full' ],
				env: { ANYTYPE_API_KEY: '${user_config.api_key}', ANYTYPE_MCP_FILES_DIR: '${user_config.files_dir}' },
			},
		});
		expect(() => verifier.verifyManifest(manifest, 'anytype-mcp.exe')).not.toThrow();
		expect(manifest.compatibility).toEqual({ platforms: [ 'win32' ] });
		expect(info.forwarder.sha256).toEqual({ 'win32-x64': sha256(fs.readFileSync(exe)) });
	});

	test('Linux: one hash per architecture and no bundle', async () => {
		const arm = path.join(dir, 'anytype-mcp-arm');

		fs.writeFileSync(arm, 'ARM-BYTES');

		const info = await build({ platform: 'linux', forwarder: forwarder({ signed: true, namespace: 'release', files: { 'linux-x64': fwd, 'linux-arm64': arm }, bundleFile: null }) });

		expect(info).toEqual({
			signed: true,
			forwarder: { rev: 6, namespace: 'release', sha256: { 'linux-x64': sha256(fs.readFileSync(fwd)), 'linux-arm64': sha256(fs.readFileSync(arm)) } },
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

		expect(info).toEqual({ signed: true, forwarder: { rev: 6, namespace: 'release', sha256: { darwin: sha256(fs.readFileSync(fwd)) } }, mcpb: null });
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

	test('MCPB_SIGN_REQUIRED=1 without the Azure Key Vault settings fails and leaves no bundle', async () => {
		const out = path.join(dir, 'mcp');

		await expect(build({ env: { MCPB_SIGN_REQUIRED: '1' } })).rejects.toThrow(/MCPB_SIGN_REQUIRED=1 but AZURE_KEY_VAULT_URI, AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_CERT_NAME, WIN_PUBLISHER_SUBJECT are not set/);
		await expect(build({ env: { ...SIGNING_ENV, AZURE_CLIENT_SECRET: '', MCPB_SIGN_REQUIRED: '1' } })).rejects.toThrow(/MCPB_SIGN_REQUIRED=1 but AZURE_CLIENT_SECRET is not set/);
		await expect(build({ env: { ...AZURE, MCPB_SIGN_REQUIRED: '1' } })).rejects.toThrow(/MCPB_SIGN_REQUIRED=1 but WIN_PUBLISHER_SUBJECT is not set/);
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

	test('the Azure settings without MCPB_SIGN_REQUIRED=1 (a Windows nightly signs only its forwarder) leave the bundle unsigned', async () => {
		const azure = fakeAzure(testPki().leaf);
		const info = await build({ env: { ...SIGNING_ENV }, signing: { fetch: azure.fetch } });

		expect(info.mcpb.signerFingerprint).toBeUndefined();
		expect(azure.calls).toEqual([]);
	});

	describe('signing with the certificate in Azure Key Vault (a local fake and test PKI)', () => {
		let pki: TestPki;

		beforeAll(() => {
			pki = testPki();
		});

		const REQUIRED = { ...SIGNING_ENV, MCPB_SIGN_REQUIRED: '1' };
		const signing = (azure = fakeAzure(pki.leaf), over: Record<string, any> = {}) => ({ fetch: azure.fetch, chain: pki.chain, chainCheck: testChainCheck(pki.root.der), sleep: async () => {}, ...over });

		test('signed: the signer\'s fingerprint and the final digest in the metadata; the bundle verifies; a release keeps its bundle', async () => {
			const out = path.join(dir, 'mcp');
			const info = await build({ env: REQUIRED, signing: signing() });
			const file = path.join(out, 'Anytype.mcpb');
			const bundle = fs.readFileSync(file);
			const fingerprint = sha256(pki.leaf.der);

			// The bundle is signed; `signed` itself says whether the forwarder is a release one (here it isn't)
			expect(info.mcpb).toEqual({ sha256: sha256(bundle), signerFingerprint: fingerprint, version: '2.6.0' });
			expect(info.signed).toBe(false);
			expect(readMeta()).toEqual(info);
			expect(await signer.verify(file, { chainCheck: testChainCheck(pki.root.der) })).toMatchObject({ status: 'signed', subject: SUBJECT, fingerprint });

			// The signature block is appended after the zip
			const parts = signer.splitSigned(bundle);
			expect(zipEntries(parts.content).map(e => e.name)).toEqual([ 'manifest.json', 'server/anytype-mcp', 'icon.png' ]);

			// The forwarder inside is still readable through the signature block (verify-forwarder reads the zip part)
			const zip = await JSZip.loadAsync(parts.content);
			expect(await zip.file('server/anytype-mcp').async('nodebuffer')).toEqual(fs.readFileSync(fwd));

			// Q12: a release-namespace build with MCPB_SIGN_REQUIRED=1 ships its signed bundle
			const release = await build({ outDir: path.join(dir, 'release'), forwarder: forwarder({ signed: true, namespace: 'release' }), env: REQUIRED, signing: signing() });

			expect(release.signed).toBe(true);
			expect(release.mcpb.signerFingerprint).toBe(fingerprint);
			expect(fs.existsSync(path.join(dir, 'release', 'Anytype.mcpb'))).toBe(true);
		});

		test('a signed build logs the signer, never a secret, the token or the key id', async () => {
			const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

			await build({ env: REQUIRED, signing: signing() });

			const logged = spy.mock.calls.flat().join('\n');

			spy.mockRestore();
			expect(logged).toContain(`is signed by "${SUBJECT}"`);
			for (const leak of LEAKS) {
				expect(logged, leak).not.toContain(leak);
			};
		});

		test('a certificate of another publisher fails the build, and leaves neither a bundle nor metadata', async () => {
			const out = path.join(dir, 'mcp');

			await expect(build({ env: REQUIRED, signing: signing(fakeAzure(pki.other)) })).rejects.toThrow(/not Anytype's Windows publisher/);
			expect(fs.existsSync(path.join(out, 'Anytype.mcpb'))).toBe(false);
			expect(fs.existsSync(metaFile)).toBe(false);
			expect(fs.readdirSync(out).filter(n => n.endsWith('.tmp'))).toEqual([]);
		});

		test('a tampered signature fails the build', async () => {
			const tampered: any = ({ init }) => {
				const sig = rs256(pki.leaf.key, Buffer.from(JSON.parse(init.body).value, 'base64url'));

				sig[sig.length - 1] ^= 0x01;
				return new Response(JSON.stringify({ value: sig.toString('base64url') }), { status: 200 });
			};

			await expect(build({ env: REQUIRED, signing: signing(fakeAzure(pki.leaf, { sign: tampered })) })).rejects.toThrow(/does not verify/);
			expect(fs.existsSync(path.join(dir, 'mcp', 'Anytype.mcpb'))).toBe(false);
			expect(fs.existsSync(metaFile)).toBe(false);
		});

		test('an untrusted chain fails the build', async () => {
			await expect(build({ env: REQUIRED, signing: signing(fakeAzure(pki.leaf), { chainCheck: async () => false }) })).rejects.toThrow(/chain is untrusted/);
			expect(fs.existsSync(metaFile)).toBe(false);
		});

		test('a failing Azure call fails the build without a secret in the error or the log, and leaves no bundle', async () => {
			const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
			const azure = fakeAzure(pki.leaf, { token: failWith(500, { error: 'server_error', error_description: `AADSTS50000: failed for ${AZURE.AZURE_CLIENT_ID} with ${AZURE.AZURE_CLIENT_SECRET}` }) });
			let message = '';

			try {
				await build({ env: REQUIRED, signing: signing(azure) });
			} catch (e) {
				message = String(e?.stack || e);
			};

			const output = message + JSON.stringify(spy.mock.calls);

			spy.mockRestore();
			expect(message).toMatch(/the Azure AD token request failed: HTTP 500 \(server_error, AADSTS50000\) \(after 3 attempts\)/);
			expect(azure.count('token')).toBe(3);
			for (const leak of LEAKS) {
				expect(output, leak).not.toContain(leak);
			};
			expect(fs.existsSync(path.join(dir, 'mcp', 'Anytype.mcpb'))).toBe(false);
			expect(fs.existsSync(metaFile)).toBe(false);
		});
	});
});
