/**
 * Checks the forwarder `anytype-mcp` inside a packaged app (docs/plans/…/anytype-mcp-plan.md §4.4):
 * - its sha256 equals the build's metadata (electron/json/aiConnect.build.json inside app.asar);
 * - Anytype.mcpb matches the metadata and carries the same forwarder bytes;
 * - no script of the old Node connector is left under dist/mcp;
 * - a release build (`signed: true`): macOS — `codesign --verify --strict`, the identifier com.anytype.mcp,
 *   the hardened runtime and no entitlements; Windows — Authenticode `Valid` with a timestamp.
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
const path = require('path');
const crypto = require('crypto');
const { execFileSync, spawnSync } = require('child_process');

const IDENTIFIER = 'com.anytype.mcp';
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

/** The Mach-O holds the package's architecture (a thin dev binary of the other one fails here) */
const verifyMacArch = (file, arch) => {
	const want = (arch == 'x64') ? 'x86_64' : 'arm64';

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
	if (!meta.forwarder) {
		if (opt.requireSigned || meta.signed) {
			fail('the build ships no forwarder');
		};
		return 'none';
	};
	if (meta.signed != (meta.forwarder.namespace == 'release')) {
		fail('the forwarder\'s namespace does not agree with `signed`');
	};

	const file = path.join(unpacked, 'dist', exe);
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

		if (!inner || (sha256(await inner.async('nodebuffer')) != expected)) {
			fail('the forwarder inside Anytype.mcpb is not the packaged one');
		};
		if ((manifest.server?.type != 'binary') || (manifest.version != meta.mcpb.version) || (manifest.version != `2.${meta.forwarder.rev}.0`)) {
			fail('Anytype.mcpb\'s manifest does not match the metadata');
		};
	};

	if ((opt.platform == 'darwin') && (process.platform == 'darwin')) {
		verifyMacArch(file, opt.arch);
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

module.exports = { verify, verifyPackaged, verifyLinux, verifyWindowsSignature, WIN_PUBLISHER_SUBJECT };

if (require.main === module) {
	const args = process.argv.slice(2);
	const appDir = args.find(it => !it.startsWith('--'));
	const archAt = args.indexOf('--arch');

	if (!appDir) {
		console.error('usage: verify-forwarder.js <appDir> [--require-signed] [--arch x64|arm64]');
		process.exit(2);
	};

	verify({
		appDir: path.resolve(appDir),
		platform: process.platform,
		arch: (archAt >= 0) ? args[archAt + 1] : process.arch,
		requireSigned: args.includes('--require-signed'),
		requireBundle: args.includes('--require-bundle'),
	}).then(res => {
		console.log(`[verify-forwarder] ${appDir}: ${res}`);
	}).catch(e => {
		console.error(e.message);
		process.exit(1);
	});
};
