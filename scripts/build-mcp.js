/**
 * Builds dist/mcp: the skill files and the static Claude Desktop bundle Anytype.mcpb (a `binary` bundle with
 * the signed forwarder `anytype-mcp` inside; no key), then writes the build's one metadata file
 * electron/json/aiConnect.build.json (docs/plans/…/anytype-mcp-plan.md §4.2), which electron-builder packs
 * into app.asar:
 *
 *   { "signed": true,
 *     "forwarder": { "rev": 5, "namespace": "release", "teamId": "…", "sha256": { "darwin": "…" } },
 *     "mcpb": { "sha256": "…", "signerFingerprint": "…", "version": "2.5.0" } }
 *
 * This script is the only writer of that file. It runs after scripts/prepare-forwarder.js signed the
 * forwarder and after the bundle was packed and signed, and before electron-builder. Only the entries for
 * the build's OS are present (Linux: one per architecture, and no bundle). No forwarder → `forwarder: null`
 * and no bundle: the stdio routes are off in that build.
 *
 * Bundle signing (release CI): MCPB_SIGN_CERT + MCPB_SIGN_KEY (PEM file paths) and MCPB_SIGN_FINGERPRINT
 * (SHA-256 of the signer certificate). MCPB_SIGN_REQUIRED=1 fails the build when they are missing.
 * `mcpb verify` (2.1.2) can't verify anything (node-forge has no PKCS#7 verify), so the signature is
 * checked with `openssl cms -verify` here and the signer's fingerprint compared with the expected one.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const JSZip = require('jszip');

const ROOT = path.join(__dirname, '..');
const FIXED_DATE = new Date('2026-01-01T00:00:00Z');
const SIG_HEADER = Buffer.from('MCPB_SIG_V1', 'utf8');
const SIG_FOOTER = Buffer.from('MCPB_SIG_END', 'utf8');
const BUNDLE = 'Anytype.mcpb';
const META = 'aiConnect.build.json';

const log = (...args) => console.log('[build-mcp]', ...args);

const mcpbCli = () => path.join(path.dirname(require.resolve('@anthropic-ai/mcpb')), 'cli', 'cli.js');

/** Runs the pinned mcpb CLI with an argument array; throws with its output on failure */
const runMcpb = (args) => {
	try {
		return execFileSync(process.execPath, [ mcpbCli(), ...args ], { encoding: 'utf8', stdio: 'pipe' });
	} catch (e) {
		throw new Error(`mcpb ${args[0]} failed:\n${String(e.stdout || '')}${String(e.stderr || '')}`);
	};
};

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

const normalizeFingerprint = (s) => String(s || '').replace(/:/g, '').trim().toLowerCase();

/** The zip and the PKCS#7 signature appended by `mcpb sign`, or null when the file isn't signed that way */
const splitSigned = (buf) => {
	const footer = buf.length - SIG_FOOTER.length;

	if ((footer < 0) || !buf.subarray(footer).equals(SIG_FOOTER)) {
		return null;
	};

	const header = buf.lastIndexOf(SIG_HEADER, footer);
	if (header < 0) {
		return null;
	};

	const lenAt = header + SIG_HEADER.length;
	const len = buf.readUInt32LE(lenAt);

	if ((lenAt + 4 + len) != footer) {
		return null;
	};

	return { content: buf.subarray(0, header), signature: buf.subarray(lenAt + 4, footer) };
};

/**
 * Verifies the detached PKCS#7 signature over the archive and returns the signer certificate's
 * SHA-256 fingerprint (lowercase hex). The chain isn't checked: the expected fingerprint is the pin.
 */
const verifySignedBundle = (file, opt = {}) => {
	const parts = splitSigned(fs.readFileSync(file));

	if (!parts) {
		throw new Error(`${path.basename(file)} has no signature block`);
	};

	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'anytype-mcpb-verify-'));

	try {
		const content = path.join(dir, 'content.bin');
		const sig = path.join(dir, 'sig.der');
		const signer = path.join(dir, 'signer.pem');

		fs.writeFileSync(content, parts.content);
		fs.writeFileSync(sig, parts.signature);

		try {
			execFileSync(opt.openssl || 'openssl', [
				'cms', '-verify', '-binary', '-inform', 'DER', '-in', sig, '-content', content,
				'-noverify', '-signer', signer, '-out', path.join(dir, 'out.bin'),
			], { stdio: 'pipe', cwd: dir });
		} catch (e) {
			throw new Error(`signature verification failed: ${String(e.stderr || e.message).trim()}`);
		};

		const pem = fs.readFileSync(signer, 'utf8');
		const count = (pem.match(/-----BEGIN CERTIFICATE-----/g) || []).length;

		if (count != 1) {
			throw new Error(`expected one signer certificate, found ${count}`);
		};

		return normalizeFingerprint(new crypto.X509Certificate(pem).fingerprint256);
	} finally {
		fs.rmSync(dir, { recursive: true, force: true });
	};
};

/** Stored (not deflated) entries with fixed dates, in a fixed order; `mode` is the entry's Unix mode (0755 for the binary) */
const pack = async (files) => {
	const zip = new JSZip();

	for (const [ name, data, mode ] of files) {
		zip.file(name, data, { date: FIXED_DATE, binary: true, createFolders: false, unixPermissions: 0o100000 | (mode || 0o644) });
	};

	return zip.generateAsync({ type: 'nodebuffer', compression: 'STORE', platform: 'UNIX' });
};

const sign = (file, env) => {
	const cert = env.MCPB_SIGN_CERT;
	const key = env.MCPB_SIGN_KEY;

	if (!cert && !key) {
		if (env.MCPB_SIGN_REQUIRED == '1') {
			throw new Error('MCPB_SIGN_REQUIRED=1 but MCPB_SIGN_CERT / MCPB_SIGN_KEY are not set');
		};
		log(`${BUNDLE} is UNSIGNED`);
		return null;
	};

	if (!cert || !key) {
		throw new Error('set both MCPB_SIGN_CERT and MCPB_SIGN_KEY, or neither');
	};

	const expected = normalizeFingerprint(env.MCPB_SIGN_FINGERPRINT);
	if (!/^[0-9a-f]{64}$/.test(expected)) {
		throw new Error('MCPB_SIGN_FINGERPRINT must be the SHA-256 fingerprint of the signing certificate');
	};

	runMcpb([ 'sign', file, '--cert', cert, '--key', key ]);

	const actual = verifySignedBundle(file, { openssl: env.MCPB_OPENSSL });
	if (actual != expected) {
		// Neither fingerprint goes to the output (CI passes the expected one as a secret)
		throw new Error(`${BUNDLE} signer does not match MCPB_SIGN_FINGERPRINT`);
	};

	// The fingerprint itself stays out of the log (CI passes it as a secret, possibly in another spelling)
	log(`${BUNDLE} is signed; signer verified`);
	return actual;
};

/** The bundle's manifest for one OS, from the template electron/mcp/manifest.json and the real payload name */
const manifestFor = (template, opt) => {
	const entry = `server/${opt.exe}`;

	return {
		...template,
		// A build that isn't a release names its bundle anytype-dev: a separate extension in Claude
		name: opt.signed ? template.name : `${template.name}-dev`,
		display_name: opt.signed ? template.display_name : `${template.display_name} (dev)`,
		// A forwarder fix raises `rev`, so the installed extension is replaced through the existing `outdated` flow
		version: `2.${opt.rev}.0`,
		server: {
			type: 'binary',
			entry_point: entry,
			mcp_config: { command: `\${__dirname}/${entry}`, args: [ 'serve', '--connection', 'claude-desktop' ] },
		},
		compatibility: { platforms: [ opt.platform ] },
	};
};

/**
 * @param {{
 *   outDir?: string, rootDir?: string, metaFile?: string, platform?: string, env?: Record<string, string | undefined>,
 *   forwarder?: null | { signed: boolean, namespace: string, rev: number, teamId?: string, files: Record<string, string>, bundleFile: string | null },
 * }} opt
 * @returns {Promise<{ signed: boolean, forwarder: object | null, mcpb: object | null }>} the metadata written
 */
const build = async (opt = {}) => {
	const root = opt.rootDir || ROOT;
	const outDir = opt.outDir || path.join(root, 'dist', 'mcp');
	const metaFile = opt.metaFile || path.join(root, 'electron', 'json', META);
	const env = opt.env || process.env;
	const platform = opt.platform || process.platform;
	const fwd = opt.forwarder || null;
	const src = {
		manifest: path.join(root, 'electron', 'mcp', 'manifest.json'),
		preamble: path.join(root, 'electron', 'mcp', 'skill-preamble.md'),
		skill: path.join(root, 'vendor', 'anytype-api-skill', 'SKILL.md'),
		icon: path.join(root, 'electron', 'img', 'icons', '256x256.png'),
	};
	const metaTemp = `${metaFile}.${process.pid}.tmp`;

	// Old metadata goes first: until the new one is published last, the app sees no forwarder and no bundle
	// rather than new files described by old (possibly "signed") metadata
	fs.rmSync(metaFile, { force: true });
	// Nothing of an earlier build stays in dist/mcp (no stale bundle, no leftover scripts)
	fs.rmSync(outDir, { recursive: true, force: true });
	fs.mkdirSync(path.join(outDir, 'skill'), { recursive: true });
	fs.copyFileSync(src.skill, path.join(outDir, 'skill', 'SKILL.md'));
	fs.copyFileSync(src.preamble, path.join(outDir, 'skill', 'PREAMBLE.md'));

	const meta = { signed: !!fwd?.signed, forwarder: null, mcpb: null };
	const bundle = path.join(outDir, BUNDLE);
	const bundleTemp = path.join(outDir, `.${BUNDLE}.${process.pid}.tmp`);
	const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'anytype-mcpb-'));

	try {
		if (fwd) {
			const sha = {};

			for (const [ key, file ] of Object.entries(fwd.files)) {
				sha[key] = sha256(fs.readFileSync(file));
			};
			meta.forwarder = { rev: fwd.rev, namespace: fwd.namespace, ...(fwd.teamId ? { teamId: fwd.teamId } : {}), sha256: sha };
		};

		// The bundle: macOS and Windows only, one per OS, with that OS's signed forwarder inside
		if (fwd?.bundleFile && [ 'darwin', 'win32' ].includes(platform)) {
			const exe = (platform == 'win32') ? 'anytype-mcp.exe' : 'anytype-mcp';
			const binary = fs.readFileSync(fwd.bundleFile);
			const manifest = manifestFor(JSON.parse(fs.readFileSync(src.manifest, 'utf8')), { exe, platform, rev: fwd.rev, signed: fwd.signed });
			const manifestText = Buffer.from(JSON.stringify(manifest, null, 2) + '\n', 'utf8');

			fs.mkdirSync(path.join(stage, 'server'));
			fs.writeFileSync(path.join(stage, 'manifest.json'), manifestText);
			fs.copyFileSync(src.icon, path.join(stage, 'icon.png'));
			fs.writeFileSync(path.join(stage, 'server', exe), binary, { mode: 0o755 });

			runMcpb([ 'validate', path.join(stage, 'manifest.json') ]);

			const zip = await pack([
				[ 'manifest.json', manifestText ],
				[ `server/${exe}`, binary, 0o755 ],
				[ 'icon.png', fs.readFileSync(src.icon) ],
			]);

			fs.writeFileSync(bundleTemp, zip);

			// MCPB_SIGN_REQUIRED=1 (a release): no signature fails the build
			const signerFingerprint = sign(bundleTemp, env);

			if (fwd.signed && !signerFingerprint) {
				// A release-namespace build whose bundle wasn't signed (a nightly without the MCPB_SIGN_* secrets) ships
				// no bundle: the desktop only hands a key to an extension whose signer it can verify, so Claude uses the
				// config route there
				log(`${BUNDLE} is not shipped: a release-namespace build needs a signed bundle`);
				fs.rmSync(bundleTemp, { force: true });
			} else {
				meta.mcpb = { sha256: sha256(fs.readFileSync(bundleTemp)), version: manifest.version };
				if (signerFingerprint) {
					meta.mcpb.signerFingerprint = signerFingerprint;
				};
				fs.renameSync(bundleTemp, bundle);
			};
		};

		fs.mkdirSync(path.dirname(metaFile), { recursive: true });
		fs.writeFileSync(metaTemp, JSON.stringify(meta, null, 2) + '\n');
		fs.renameSync(metaTemp, metaFile);
	} catch (e) {
		// Never leave a bundle or a forwarder behind that the app would use without matching metadata
		fs.rmSync(bundleTemp, { force: true });
		fs.rmSync(metaTemp, { force: true });
		fs.rmSync(bundle, { force: true });
		fs.rmSync(metaFile, { force: true });
		throw e;
	} finally {
		fs.rmSync(stage, { recursive: true, force: true });
	};

	return meta;
};

module.exports = { build, verifySignedBundle, splitSigned, normalizeFingerprint, manifestFor, META };

if (require.main === module) {
	require('./prepare-forwarder').prepare().then(forwarder => build({ forwarder })).catch((e) => {
		console.error('[build-mcp]', e.message);
		process.exit(1);
	});
};
