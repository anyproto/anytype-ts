/**
 * Builds dist/mcp: the skill files and the static Claude Desktop bundle Anytype.mcpb (a `binary` bundle with
 * the signed forwarder `anytype-mcp` inside; no key), then writes the build's one metadata file
 * electron/json/aiConnect.build.json (docs/plans/…/anytype-mcp-plan.md §4.2), which electron-builder packs
 * into app.asar:
 *
 *   { "signed": true,
 *     "forwarder": { "rev": 6, "namespace": "release", "teamId": "…", "sha256": { "darwin": "…" } },
 *     "mcpb": { "sha256": "…", "signerFingerprint": "…", "version": "2.6.0" } }
 *
 * This script is the only writer of that file. It runs after scripts/prepare-forwarder.js signed the
 * forwarder and after the bundle was packed and signed, and before electron-builder. Only the entries for
 * the build's OS are present (Linux: one per architecture, and no bundle). No forwarder → `forwarder: null`
 * and no bundle: the stdio routes are off in that build.
 *
 * Bundle signing: MCPB_SIGN_REQUIRED=1 (tag builds on macOS and Windows; a nightly with NIGHTLY_MCPB_SIGN_REQUIRED)
 * signs the bundle with Anytype's Windows code-signing certificate in Azure Key Vault, remotely
 * (scripts/sign-mcpb-azure.js; the AZURE_* secrets AzureSignTool uses), verifies the signature and the chain, and
 * requires the signer's subject to be exactly WIN_PUBLISHER_SUBJECT (a repository variable, read through
 * electron/hook/verify-forwarder.js). Without the switch the bundle stays unsigned. `signerFingerprint` is the
 * SHA-256 of the signer certificate's DER, the fingerprint Claude Desktop records for an installed extension.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const JSZip = require('jszip');
const azureSigner = require('./sign-mcpb-azure');

const ROOT = path.join(__dirname, '..');
const FIXED_DATE = new Date('2026-01-01T00:00:00Z');
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

/** Stored (not deflated) entries with fixed dates, in a fixed order; `mode` is the entry's Unix mode (0755 for the binary) */
const pack = async (files) => {
	const zip = new JSZip();

	for (const [ name, data, mode ] of files) {
		zip.file(name, data, { date: FIXED_DATE, binary: true, createFolders: false, unixPermissions: 0o100000 | (mode || 0o644) });
	};

	return zip.generateAsync({ type: 'nodebuffer', compression: 'STORE', platform: 'UNIX' });
};

/**
 * Signs the bundle when the build must be signed (MCPB_SIGN_REQUIRED=1), with the Windows code-signing certificate in
 * Azure Key Vault; any other build leaves it unsigned. Returns the signer certificate's SHA-256 (lowercase hex) or null.
 * `opt` reaches the signer (tests: its fetch, chain check and chain)
 */
const sign = async (file, env, opt = {}) => {
	if (env.MCPB_SIGN_REQUIRED != '1') {
		log(`${BUNDLE} is UNSIGNED`);
		return null;
	};

	const missing = azureSigner.missingSettings(env);

	if (missing.length) {
		throw new Error(`MCPB_SIGN_REQUIRED=1 but ${missing.join(', ')} ${(missing.length == 1) ? 'is' : 'are'} not set: ${BUNDLE} is signed with the Windows code-signing certificate in Azure Key Vault, whose subject must be WIN_PUBLISHER_SUBJECT`);
	};

	const res = await azureSigner.sign(file, { ...opt, env });

	// Public values: the certificate is in every signed Anytype.exe
	log(`${BUNDLE} is signed by "${res.subject}" (certificate SHA-256 ${res.fingerprint}); signature verified, chain ${(res.status == 'signed') ? 'trusted for code signing' : 'not checked on this OS'}`);
	return res.fingerprint;
};

/**
 * The bundle's manifest for one OS, from the template electron/mcp/manifest.json and the real payload name
 * (tokens-plan §3.3): always the Full tool set; the key comes from the required, sensitive `user_config.api_key`
 * Claude asks for, through `env` only (never an argument); the optional folder for files likewise
 */
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
			mcp_config: {
				command: `\${__dirname}/${entry}`,
				args: [ 'serve', '--tier', 'full' ],
				env: { ANYTYPE_API_KEY: '${user_config.api_key}', ANYTYPE_MCP_FILES_DIR: '${user_config.files_dir}' },
			},
		},
		compatibility: { platforms: [ opt.platform ] },
	};
};

/**
 * @param {{
 *   outDir?: string, rootDir?: string, metaFile?: string, platform?: string, env?: Record<string, string | undefined>,
 *   forwarder?: null | { signed: boolean, namespace: string, rev: number, teamId?: string, files: Record<string, string>, bundleFile: string | null },
 *   signing?: object,
 * }} opt `signing`: options for scripts/sign-mcpb-azure.js `sign` (tests)
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
			const signerFingerprint = await sign(bundleTemp, env, opt.signing);

			if (fwd.signed && !signerFingerprint) {
				// A release-namespace build whose bundle wasn't signed (a nightly without NIGHTLY_MCPB_SIGN_REQUIRED) ships
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

module.exports = { build, manifestFor, META };

if (require.main === module) {
	require('./prepare-forwarder').prepare().then(forwarder => build({ forwarder })).catch((e) => {
		console.error('[build-mcp]', e.message);
		process.exit(1);
	});
};
