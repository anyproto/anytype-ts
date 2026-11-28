/**
 * Checks the forwarder `anytype-mcp` inside a packaged app (docs/plans/…/anytype-mcp-plan.md §4.4):
 * - its sha256 equals the build's metadata (electron/json/aiConnect.build.json inside app.asar);
 * - Anytype.mcpb matches the metadata and carries the same forwarder bytes;
 * - no script of the old Node connector is left under dist/mcp;
 * - a release build (`signed: true`): macOS — `codesign --verify --strict`, the identifier com.anytype.mcp,
 *   the hardened runtime and no entitlements; Windows — Authenticode `Valid` with a timestamp;
 * - every slice of the packaged forwarder and of the one inside the bundle carries the revision marker
 *   `anytype-mcp-rev:<N>`, the build's revision, at least MIN_FORWARDER_REV (electron/json/aiConnect.forwarder.json);
 * - the bundle's manifest launches exactly what tokens-plan §3.3 says (`serve --tier full`, the key and the folder
 *   for files from `user_config` through `env` only), and that launch, resolved by the pinned MCPB resolver as
 *   Claude resolves it, starts the bundled forwarder and ends with exit 0 when its stdin is closed (the smoke) —
 *   on macOS under the package's architecture (the Intel package through Rosetta on Apple Silicon);
 * - a build whose metadata has no forwarder ships no forwarder executable either.
 *
 * Used by the afterSign hook (before notarization) and by the release and nightly workflows on the finished
 * packages, where it automates the plan's spikes S2 (`signIgnore` keeps the pre-signed binary) and S4
 * (the sign hook's early return leaves the forwarder's bytes unchanged):
 *
 *   node electron/hook/verify-forwarder.js <appDir> [--require-signed] [--require-bundle] [--arch x64|arm64]
 *
 * `<appDir>`: Anytype.app (macOS) or the unpacked folder (win-unpacked, linux-unpacked).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { pathToFileURL } = require('url');
const { execFileSync, spawnSync } = require('child_process');

const IDENTIFIER = 'com.anytype.mcp';
/** The oldest forwarder revision this desktop works with (MIN_FORWARDER_REV; one constant with prepare-forwarder.js and main) */
const MIN_REV = require('../json/aiConnect.forwarder.json').minRev;
const REV_MARKER = /anytype-mcp-rev:(\d+)/g;
const RELEASE_MARKER = Buffer.from('anytype-mcp-namespace:release', 'utf8');
/** A synthetic key for the smoke: valid for the forwarder (visible ASCII), never a real one */
const SMOKE_KEY = 'anytype-mcp-smoke-0123456789abcdef0123456789abcdef';
/**
 * The exact subject of the certificate Anytype's Windows binaries are signed with:
 * `(Get-AuthenticodeSignature Anytype.exe).SignerCertificate.Subject` of a released build.
 * TODO(Roma): fill in before merging — the repository holds no copy of it (the certificate is picked by the
 * AZURE_CERT_NAME secret). While it is empty, a signed Windows build fails this check.
 */
const WIN_PUBLISHER_SUBJECT = '';
const SIG_HEADER = Buffer.from('MCPB_SIG_V1', 'utf8');
const SIG_FOOTER = Buffer.from('MCPB_SIG_END', 'utf8');

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

const fail = (msg) => {
	throw new Error(`[verify-forwarder] ${msg}`);
};

/** stdout + stderr of a command, whatever its exit code (codesign prints its details on stderr) */
const output = (file, args, env) => {
	const res = spawnSync(file, args, { encoding: 'utf8', stdio: [ 'ignore', 'pipe', 'pipe' ], env: env || process.env });
	return String(res.stdout || '') + String(res.stderr || '');
};

/** The zip part of a bundle signed by `mcpb sign` (the whole file when it isn't signed) */
const zipPart = (buf) => {
	const footer = buf.length - SIG_FOOTER.length;

	if ((footer < 0) || !buf.subarray(footer).equals(SIG_FOOTER)) {
		return buf;
	};

	const header = buf.lastIndexOf(SIG_HEADER, footer);
	return (header < 0) ? buf : buf.subarray(0, header);
};

const walk = (dir) => {
	let ret = [];

	for (const it of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, it.name);
		ret = ret.concat(it.isDirectory() ? walk(p) : [ p ]);
	};
	return ret;
};

const verifyMacSignature = (file) => {
	try {
		execFileSync('/usr/bin/codesign', [ '--verify', '--strict', file ], { stdio: 'pipe' });
	} catch (e) {
		fail(`codesign --verify --strict failed for ${file}: ${String(e.stderr || e.message).trim()}`);
	};

	const info = output('/usr/bin/codesign', [ '-d', '--verbose=4', file ]);
	const identifier = (/^Identifier=(.+)$/m.exec(info) || [])[1];
	const flags = (/^CodeDirectory .*flags=\S*\(([^)]*)\)/m.exec(info) || [])[1] || '';
	const requirement = output('/usr/bin/codesign', [ '-d', '-r-', file ]);
	let entitlements = '';

	try {
		entitlements = execFileSync('/usr/bin/codesign', [ '-d', '--entitlements', '-', '--xml', file ], { encoding: 'utf8', stdio: [ 'ignore', 'pipe', 'ignore' ] }).trim();
	} catch (e) {
		fail(`the forwarder's entitlements could not be read: ${file}`);
	};

	if (identifier != IDENTIFIER) {
		fail(`the forwarder's identifier is ${identifier}, expected ${IDENTIFIER}`);
	};
	if (!requirement.includes(`identifier "${IDENTIFIER}"`)) {
		fail('the forwarder\'s designated requirement does not name its identifier');
	};
	if (!flags.split(',').includes('runtime')) {
		fail('the forwarder lost the hardened runtime flag');
	};
	if (entitlements) {
		fail('the forwarder carries entitlements; it must have none');
	};
};

/** `Status|has a timestamp|subject` of a file's Authenticode signature */
const windowsSignature = (file) => {
	const ps = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
	const script = '$s = Get-AuthenticodeSignature -LiteralPath $env:ANYTYPE_MCP_FILE; "$($s.Status)|$([bool]$s.TimeStamperCertificate)|$($s.SignerCertificate.Subject)"';

	return output(ps, [ '-NoProfile', '-NonInteractive', '-Command', script ], { ...process.env, ANYTYPE_MCP_FILE: file }).trim();
};

/** Valid, timestamped, and signed by exactly our publisher (Q13); `query` and `expected` are injected by tests */
const verifyWindowsSignature = (file, query = windowsSignature, expected = WIN_PUBLISHER_SUBJECT) => {
	const [ status, stamped, ...rest ] = String(query(file) || '').split('|');
	const subject = rest.join('|');

	if ((status != 'Valid') || (stamped != 'True')) {
		fail(`the forwarder's Authenticode signature is not valid and timestamped (${status || 'no answer'}): ${file}`);
	};
	if (!expected) {
		fail('WIN_PUBLISHER_SUBJECT is not set in electron/hook/verify-forwarder.js: the signer of the forwarder can\'t be checked');
	};
	if (subject !== expected) {
		fail(`the forwarder is signed by another publisher than Anytype's: ${subject}`);
	};
};

// ---------------------- revision and namespace markers ---------------------- //

/**
 * The slices of a Mach-O universal file (fat header, 32- or 64-bit offsets), read without lipo so any OS can
 * check a macOS file; any other file is one slice. null: a fat header whose slices lie outside the file.
 */
const slicesOf = (buf) => {
	const magic = (buf.length >= 8) ? buf.readUInt32BE(0) : 0;
	const wide = (magic == 0xcafebabf);

	if ((magic != 0xcafebabe) && !wide) {
		return [ buf ];
	};

	const count = buf.readUInt32BE(4);
	const size = wide ? 32 : 20;

	// 0xcafebabe also starts a Java class file, whose second word is its version (45 and up): not a universal binary
	if (!count || (count > 16) || ((8 + (count * size)) > buf.length)) {
		return [ buf ];
	};

	const ret = [];

	for (let i = 0; i < count; i++) {
		const at = 8 + (i * size);
		const offset = wide ? Number(buf.readBigUInt64BE(at + 8)) : buf.readUInt32BE(at + 8);
		const length = wide ? Number(buf.readBigUInt64BE(at + 16)) : buf.readUInt32BE(at + 12);

		if (!length || ((offset + length) > buf.length)) {
			return null;
		};
		ret.push(buf.subarray(offset, offset + length));
	};
	return ret;
};

/** The one revision a slice names (null: none, or several different ones) */
const revisionOf = (slice) => {
	const found = [ ...new Set([ ...slice.toString('latin1').matchAll(REV_MARKER) ].map(m => Number(m[1]))) ];
	return ((found.length == 1) && Number.isSafeInteger(found[0])) ? found[0] : null;
};

/**
 * What a forwarder file says about itself, per slice, by a byte search: its revision marker and its namespace
 * (only the release build carries the release marker). null when its slices can't be read.
 *
 * @param {Buffer} buf
 * @returns {null | { rev: number | null, namespace: 'release' | 'dev' }[]}
 */
const forwarderMarkers = (buf) => {
	const slices = slicesOf(buf);
	return slices ? slices.map(slice => ({ rev: revisionOf(slice), namespace: slice.includes(RELEASE_MARKER) ? 'release' : 'dev' })) : null;
};

/** Every slice of `buf` names the revision `rev`, which is at least MIN_REV */
const verifyRevision = (buf, what, rev) => {
	const markers = forwarderMarkers(buf);

	if (!markers) {
		fail(`${what}: its universal header names slices outside the file`);
	};
	for (const m of markers) {
		if (m.rev === null) {
			fail(`${what}: a slice has no revision marker (anytype-mcp-rev:<N>)`);
		};
		if (m.rev < MIN_REV) {
			fail(`${what}: a slice is revision ${m.rev}, this desktop needs at least ${MIN_REV}`);
		};
		if (m.rev != rev) {
			fail(`${what}: a slice is revision ${m.rev}, the build's metadata says ${rev}`);
		};
	};
};

// ---------------------- the bundle's launch ---------------------- //

/** tokens-plan §3.3: what Claude must start, and the two fields it asks the user for */
const expectedLaunch = (exe) => ({
	entry_point: `server/${exe}`,
	mcp_config: {
		command: `\${__dirname}/server/${exe}`,
		args: [ 'serve', '--tier', 'full' ],
		env: { ANYTYPE_API_KEY: '${user_config.api_key}', ANYTYPE_MCP_FILES_DIR: '${user_config.files_dir}' },
	},
	user_config: {
		api_key: { type: 'string', title: 'Anytype key', description: 'Anytype copied it for you. Paste it here.', sensitive: true, required: true },
		files_dir: {
			type: 'directory', title: 'Folder for files (optional)',
			description: 'The only folder Claude may upload from and download to. Leave it empty to use a temporary folder. Your home folder can\'t be used.',
			required: false,
		},
	},
});

/** Key order doesn't matter, everything else does */
const sameValue = (a, b) => {
	if ((a === null) || (b === null) || (typeof a != 'object') || (typeof b != 'object')) {
		return a === b;
	};
	if (Array.isArray(a) != Array.isArray(b)) {
		return false;
	};

	const ka = Object.keys(a).sort();
	const kb = Object.keys(b).sort();

	return (ka.length == kb.length) && ka.every((k, i) => (k == kb[i]) && sameValue(a[k], b[k]));
};

/**
 * The packed manifest launches exactly §3.3: entry point, command, `serve --tier full`, the two env mappings and
 * nothing else (no platform override, no other variable), and declares exactly the two fields
 */
const verifyManifest = (manifest, exe) => {
	const want = expectedLaunch(exe);
	const server = manifest?.server || {};

	if (server.entry_point !== want.entry_point) {
		fail(`Anytype.mcpb's entry point is not ${want.entry_point}`);
	};
	if (!sameValue(server.mcp_config, want.mcp_config)) {
		fail('Anytype.mcpb\'s manifest does not launch `serve --tier full` with the key and the folder for files from user_config through env only');
	};
	if (!sameValue(manifest.user_config, want.user_config)) {
		fail('Anytype.mcpb\'s manifest does not declare exactly the required, sensitive key and the optional folder for files');
	};
};

/**
 * The pinned MCPB resolver (@anthropic-ai/mcpb, the version the build packs with): Claude's own substitution rules.
 * Residual (D1B-01): it substitutes with `String.replace` and the value as the replacement string, so `$'`, `` $` ``,
 * `$&` and `$$` in the name of the folder the user picks reach the forwarder rewritten (`/a/b/$'` → `/a/b/`). Only
 * the resolver can fix that; the forwarder refuses the home folder and every folder around it whatever the spelling
 */
const mcpbResolver = async () => {
	const file = path.join(path.dirname(require.resolve('@anthropic-ai/mcpb')), 'shared', 'config.js');
	return (await import(pathToFileURL(file).href)).getMcpConfigForManifest;
};

/** macOS names of node's architectures, for `arch` and `lipo` */
const MAC_ARCH = { x64: 'x86_64', arm64: 'arm64' };

/**
 * The smoke: the bundle unpacked as Claude unpacks it (each entry with its own Unix mode), its `mcp_config`
 * resolved with a synthetic key and no folder for files, and that command started with that environment and its
 * stdin closed. The forwarder must start and end with exit 0. A throwaway home and temp folder: nothing of the
 * real ones is read, and what the forwarder makes there (its `anytype-mcp-files-*` folder) goes with the rest.
 * A plain folder for files must reach the forwarder unchanged through the same resolver.
 *
 * @param {import('jszip')} zip the bundle's archive
 * @param {any} manifest its parsed manifest.json
 * @param {{ arch?: 'x64' | 'arm64' }} [opt] macOS: start the slice of this architecture (`/usr/bin/arch`; the Intel
 *   one runs through Rosetta on Apple Silicon, and fails the smoke where it can't run)
 */
const smoke = async (zip, manifest, opt = {}) => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'anytype-mcpb-smoke-'));
	const ext = path.join(dir, 'extension');
	const home = path.join(dir, 'home');
	const tmp = path.join(dir, 'tmp');

	try {
		fs.mkdirSync(ext);
		fs.mkdirSync(home);
		fs.mkdirSync(tmp);

		for (const entry of Object.values(zip.files)) {
			const parts = entry.name.split('/').filter(Boolean);

			if (entry.dir) {
				continue;
			};
			if (path.isAbsolute(entry.name) || parts.some(p => (p == '..') || (p == '.'))) {
				fail(`Anytype.mcpb holds an entry outside its folder: ${entry.name}`);
			};

			const file = path.join(ext, ...parts);
			const mode = entry.unixPermissions ? (Number(entry.unixPermissions) & 0o777) : 0o644;

			fs.mkdirSync(path.dirname(file), { recursive: true });
			fs.writeFileSync(file, await entry.async('nodebuffer'), { mode });
			fs.chmodSync(file, mode);
		};

		const resolve = await mcpbResolver();
		const launch = (userConfig) => resolve({ manifest, extensionPath: ext, systemDirs: {}, userConfig, pathSeparator: path.sep });
		const config = await launch({ api_key: SMOKE_KEY });
		const folder = path.join(dir, 'Files for Claude (1)');

		if (!config?.command) {
			fail('the MCPB resolver gives Anytype.mcpb no launch with only the key filled in');
		};
		if ((await launch({ api_key: SMOKE_KEY, files_dir: folder }))?.env?.ANYTYPE_MCP_FILES_DIR !== folder) {
			fail('the MCPB resolver does not pass a plain folder for files to the forwarder unchanged');
		};

		const base = {};

		for (const k of [ 'PATH', 'SystemRoot' ]) {
			if (process.env[k]) {
				base[k] = process.env[k];
			};
		};

		const env = { ...base, HOME: home, USERPROFILE: home, TMPDIR: tmp, TMP: tmp, TEMP: tmp, ...(config.env || {}) };
		const archName = ((process.platform == 'darwin') && opt.arch) ? MAC_ARCH[opt.arch] : '';
		const [ command, args ] = archName ? [ '/usr/bin/arch', [ `-${archName}`, config.command, ...(config.args || []) ] ] : [ config.command, config.args || [] ];
		const res = spawnSync(command, args, { cwd: ext, env, stdio: [ 'ignore', 'ignore', 'ignore' ], timeout: 30000 });

		if (res.status !== 0) {
			const how = res.error ? res.error.code : ((res.status === null) ? `signal ${res.signal}` : `exit ${res.status}`);
			fail(`the bundle's own launch${archName ? ` (${archName})` : ''} did not end with exit 0 (${how})`);
		};
	} finally {
		fs.rmSync(dir, { recursive: true, force: true });
	};
};

/** The Mach-O holds the package's architecture (a thin dev binary of the other one fails here) */
const verifyMacArch = (file, arch) => {
	const want = MAC_ARCH[arch] || 'arm64';

	try {
		execFileSync('/usr/bin/lipo', [ file, '-verify_arch', want ], { stdio: 'pipe' });
	} catch (e) {
		fail(`the forwarder has no ${want} slice for this package: ${file}`);
	};
};

/**
 * @param {{ appDir: string, platform: string, arch: string, requireSigned?: boolean, requireBundle?: boolean }} opt
 * @returns {Promise<'verified' | 'none'>} `none`: the build ships no forwarder (allowed only without `requireSigned`)
 */
const verify = async (opt) => {
	const asar = require('@electron/asar');
	const JSZip = require('jszip');
	const resources = (opt.platform == 'darwin') ? path.join(opt.appDir, 'Contents', 'Resources') : path.join(opt.appDir, 'resources');
	const unpacked = path.join(resources, 'app.asar.unpacked');
	const exe = (opt.platform == 'win32') ? 'anytype-mcp.exe' : 'anytype-mcp';
	const key = (opt.platform == 'darwin') ? 'darwin' : ((opt.platform == 'win32') ? 'win32-x64' : `linux-${opt.arch}`);
	const mcpDir = path.join(unpacked, 'dist', 'mcp');
	let meta = null;

	// A package rebuilt at the same path must be read afresh
	asar.uncache(path.join(resources, 'app.asar'));

	try {
		meta = JSON.parse(asar.extractFile(path.join(resources, 'app.asar'), path.join('electron', 'json', 'aiConnect.build.json')).toString('utf8'));
	} catch (e) {
		fail('app.asar has no electron/json/aiConnect.build.json');
	};

	// Nothing of the Node connector may ship
	for (const file of fs.existsSync(mcpDir) ? walk(mcpDir) : []) {
		if (/\.(mjs|cjs|js)$/.test(file)) {
			fail(`a script is packaged under dist/mcp: ${file}`);
		};
	};

	if (opt.requireSigned && !meta.signed) {
		fail('this build must be signed, but its metadata says signed: false');
	};
	const file = path.join(unpacked, 'dist', exe);

	if (!meta.forwarder) {
		if (opt.requireSigned || meta.signed) {
			fail('the build ships no forwarder');
		};
		// D1B-03: a forwarder the build turned down (its revision, its namespace) must not ship anyway
		for (const name of [ 'anytype-mcp', 'anytype-mcp.exe' ]) {
			if (fs.existsSync(path.join(unpacked, 'dist', name))) {
				fail(`the metadata says this build has no forwarder, but the package ships ${path.join('dist', name)}`);
			};
		};
		return 'none';
	};
	if (meta.signed != (meta.forwarder.namespace == 'release')) {
		fail('the forwarder\'s namespace does not agree with `signed`');
	};

	const expected = meta.forwarder.sha256[key];

	if (!expected) {
		// S14: a local two-arch `dist:linux` has one development forwarder, for the host's architecture. Main
		// refuses the stdio routes for an architecture without an entry, so the other package has none
		if ((opt.platform == 'linux') && !opt.requireSigned && !meta.signed) {
			console.log(`[verify-forwarder] no development forwarder for ${key}: the stdio routes are off in this package`);
			return 'none';
		};
		fail(`the metadata has no forwarder entry for ${key}`);
	};
	if (!fs.existsSync(file)) {
		fail(`the packaged app has no ${path.join('dist', exe)}`);
	};

	const actual = sha256(fs.readFileSync(file));

	if (actual != expected) {
		fail(`the packaged forwarder differs from the one the metadata describes (${key}): something signed or rewrote it during packaging`);
	};
	verifyRevision(fs.readFileSync(file), 'the packaged forwarder', meta.forwarder.rev);
	// Before the bundle's launch is started: a forwarder without this package's architecture fails as such
	if ((opt.platform == 'darwin') && (process.platform == 'darwin')) {
		verifyMacArch(file, opt.arch);
	};

	if (opt.platform != 'linux') {
		const bundle = path.join(mcpDir, 'Anytype.mcpb');

		// Q12: a build may ship no bundle (its signing inputs were not given): Claude then uses the config route.
		// A release requires one (`--require-bundle`)
		if (!meta.mcpb && !opt.requireBundle) {
			if (fs.existsSync(bundle)) {
				fail('an Anytype.mcpb is packaged that the metadata does not describe');
			};
		} else
		if (!meta.mcpb || !fs.existsSync(bundle)) {
			fail('the build ships no Anytype.mcpb');
		};
	};

	if ((opt.platform != 'linux') && meta.mcpb) {
		const bundle = path.join(mcpDir, 'Anytype.mcpb');

		const data = fs.readFileSync(bundle);

		if (sha256(data) != meta.mcpb.sha256) {
			fail('Anytype.mcpb differs from the one the metadata describes');
		};
		if (meta.signed && !meta.mcpb.signerFingerprint) {
			fail('Anytype.mcpb of a signed build is not signed');
		};

		const zip = await JSZip.loadAsync(zipPart(data));
		const inner = zip.file(`server/${exe}`);
		const manifest = JSON.parse(await zip.file('manifest.json').async('string'));
		const innerData = inner ? await inner.async('nodebuffer') : null;

		if (!innerData || (sha256(innerData) != expected)) {
			fail('the forwarder inside Anytype.mcpb is not the packaged one');
		};
		if ((manifest.server?.type != 'binary') || (manifest.version != meta.mcpb.version) || (manifest.version != `2.${meta.forwarder.rev}.0`)) {
			fail('Anytype.mcpb\'s manifest does not match the metadata');
		};
		verifyManifest(manifest, exe);
		verifyRevision(innerData, 'the forwarder inside Anytype.mcpb', meta.forwarder.rev);

		// Only on the package's own OS (as in CI). macOS: under the package's architecture, so each package starts its own
		// slice of the universal file — the Intel one through Rosetta on Apple Silicon (no Rosetta fails the smoke). An
		// Intel host can't start the arm64 package
		if ((opt.platform == process.platform) && ((opt.platform != 'darwin') || (opt.arch == process.arch) || (process.arch == 'arm64'))) {
			await smoke(zip, manifest, (opt.platform == 'darwin') ? { arch: opt.arch } : {});
		} else {
			console.log(`[verify-forwarder] the bundle's launch is not started here (a ${opt.platform} ${opt.arch} package on ${process.platform} ${process.arch})`);
		};
	};

	if (meta.signed && (opt.platform == 'darwin')) {
		verifyMacSignature(file);
	};
	if (meta.signed && (opt.platform == 'win32')) {
		verifyWindowsSignature(file);
	};
	return 'verified';
};

/** electron-builder's Arch enum → node's name */
const ARCH = { 1: 'x64', 3: 'arm64' };

/** For the afterSign hook */
const verifyPackaged = async (context) => {
	const platform = context.electronPlatformName;
	const appDir = (platform == 'darwin') ? path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`) : context.appOutDir;
	const res = await verify({
		appDir, platform, arch: ARCH[context.arch] || process.arch,
		requireSigned: process.env.FORWARDER_SIGN_REQUIRED == '1', requireBundle: process.env.MCPB_SIGN_REQUIRED == '1',
	});

	console.log(`[verify-forwarder] ${platform} ${ARCH[context.arch] || ''}: ${res}`);
};

/** For afterPack: Linux only (macOS and Windows are checked in afterSign, after their signing) */
const verifyLinux = async (context, check = verifyPackaged) => {
	if (context.electronPlatformName == 'linux') {
		await check(context);
	};
};

module.exports = { verify, verifyPackaged, verifyLinux, verifyWindowsSignature, forwarderMarkers, verifyManifest, smoke, mcpbResolver, MIN_REV, WIN_PUBLISHER_SUBJECT };

if (require.main === module) {
	const args = process.argv.slice(2);
	const archAt = args.indexOf('--arch');
	const arch = (archAt >= 0) ? args[archAt + 1] : process.arch;
	const appDir = args.find((it, i) => !it.startsWith('--') && ((archAt < 0) || (i != (archAt + 1))));

	if (!appDir || !MAC_ARCH[arch]) {
		console.error('usage: verify-forwarder.js <appDir> [--require-signed] [--require-bundle] [--arch x64|arm64]');
		process.exit(2);
	};

	verify({
		appDir: path.resolve(appDir),
		platform: process.platform,
		arch,
		requireSigned: args.includes('--require-signed'),
		requireBundle: args.includes('--require-bundle'),
	}).then(res => {
		console.log(`[verify-forwarder] ${appDir}: ${res}`);
	}).catch(e => {
		console.error(e.message);
		process.exit(1);
	});
};
