/**
 * Puts `anytype-mcp`, heart's stdio forwarder, where the build ships it (dist/anytype-mcp[.exe]; Linux keeps
 * one file per architecture in linux-amd / linux-arm) and signs it BEFORE the frontend build, because
 * scripts/build-mcp.js packs the signed bytes into Anytype.mcpb (docs/plans/…/anytype-mcp-plan.md §4.4).
 *
 * Where the binary comes from:
 * - `ANYTYPE_MCP_BIN=<file>`: a locally built forwarder, copied to dist/ (development);
 * - update.sh (development): the archive's `anytype-mcp-dev`, already in dist/;
 * - update-ci.sh (release and nightly CI): the archive's `anytype-mcp-release`, in darwin-arm / darwin-amd
 *   (joined into one universal file here), dist/ (Windows) or linux-amd / linux-arm.
 *
 * The build flavour decides (see `prepare`): a release build (`FORWARDER_SIGN_REQUIRED=1`, the release and
 * nightly workflows) ships the release-namespace binary, signed where the OS has signatures with the tools and
 * credentials the job already has — macOS `codesign` with the Developer ID identity (hardened runtime,
 * timestamp, identifier com.anytype.mcp, no entitlements), Windows the existing hook electron/hook/sign.js —
 * or fails. Every other build ships the development-namespace binary as it is (`signed: false`), or none.
 *
 * Revision (tokens-plan §3.2): every file shipped — each macOS slice before `lipo`, each Linux architecture, the
 * Windows exe — names its revision in the plain marker `anytype-mcp-rev:<N>` and its namespace in the namespace
 * marker, read with a byte search (any OS, any architecture, without running it). All must agree and be at least
 * MIN_FORWARDER_REV (electron/json/aiConnect.forwarder.json): otherwise a release build fails and a development
 * build ships no forwarder (the stdio routes are off; the turned-down copy in dist/ is removed, so the packaging
 * lists don't pick it up).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync, spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const NAME = 'anytype-mcp';
const IDENTIFIER = 'com.anytype.mcp';
/** One constant for this script, the packaged-app check and main */
const MIN_FORWARDER_REV = require('../electron/json/aiConnect.forwarder.json').minRev;
const { forwarderMarkers } = require('../electron/hook/verify-forwarder.js');

const log = (...args) => console.log('[prepare-forwarder]', ...args);

const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

const isFile = (p) => {
	try {
		return fs.statSync(p).isFile();
	} catch (e) {
		return false;
	};
};

/** Each slice of a file (a universal macOS file has two): its revision marker and namespace; throws when unreadable */
const slicesOf = (file) => {
	const markers = forwarderMarkers(fs.readFileSync(file));

	if (!markers) {
		throw new Error(`${path.basename(file)}: its universal header names slices outside the file`);
	};
	return markers;
};

/** The same file (another spelling, a hard link): what a development build must not remove when it is ANYTYPE_MCP_BIN */
const sameFile = (a, b) => {
	try {
		const x = fs.statSync(a);
		const y = fs.statSync(b);

		return (x.dev == y.dev) && (x.ino == y.ino);
	} catch (e) {
		return false;
	};
};

/** Read off the file, for any OS and architecture: only the release build contains the marker (a universal file: release only when every slice is) */
const namespaceOf = (file) => slicesOf(file).every(m => m.namespace == 'release') ? 'release' : 'dev';

/** Why these files can't ship as one forwarder (no revision marker, revisions that differ, one below the minimum); '' when they can */
const revisionProblem = (files) => {
	const revs = [ ...new Set(files.flatMap(f => slicesOf(f).map(m => m.rev))) ];

	if (revs.includes(null)) {
		return 'a forwarder file has no revision marker (anytype-mcp-rev:<N>)';
	};
	if (revs.length != 1) {
		return `the forwarder files have different revisions (${revs.sort().join(', ')})`;
	};
	if (revs[0] < MIN_FORWARDER_REV) {
		return `the forwarder is revision ${revs[0]}, this desktop needs at least ${MIN_FORWARDER_REV}`;
	};
	return '';
};

/** What a run of the downloaded forwarder may see of this process's environment: nothing a CI step's secrets are in */
const PROBE_ENV = [ 'PATH', 'Path', 'SystemRoot', 'SYSTEMROOT', 'windir', 'WINDIR', 'TEMP', 'TMP', 'TMPDIR', 'HOME', 'USERPROFILE', 'LANG' ];

const probeEnv = (env = process.env) => {
	const ret = {};

	for (const k of PROBE_ENV) {
		if (env[k]) {
			ret[k] = env[k];
		};
	};
	return ret;
};

/** `version --json` of a binary this machine can run, or null. It runs before it is signed: no secret of the step reaches it */
const versionOf = (file) => {
	try {
		const data = JSON.parse(execFileSync(file, [ 'version', '--json' ], { encoding: 'utf8', stdio: [ 'ignore', 'pipe', 'ignore' ], timeout: 20000, env: probeEnv() }));
		return (Number.isSafeInteger(data.rev) && (data.rev > 0) && [ 'release', 'dev' ].includes(data.namespace) && (data.impl == 'go')) ? data : null;
	} catch (e) {
		return null;
	};
};

const run = (file, args, opt = {}) => execFileSync(file, args, { encoding: 'utf8', stdio: [ 'ignore', 'pipe', 'pipe' ], ...opt });

/** stdout + stderr of a command, whatever its exit code (codesign prints its details on stderr) */
const output = (file, args) => {
	const res = spawnSync(file, args, { encoding: 'utf8', stdio: [ 'ignore', 'pipe', 'pipe' ] });
	return String(res.stdout || '') + String(res.stderr || '');
};

/**
 * What codesign says about a macOS binary: a valid signature with our identifier, the hardened runtime
 * and no entitlements; `teamId` from its certificate. Throws with the reason otherwise.
 */
const verifyMac = (file) => {
	run('/usr/bin/codesign', [ '--verify', '--strict', file ]);

	// codesign prints the details on stderr
	const info = output('/usr/bin/codesign', [ '-d', '--verbose=4', file ]);
	const identifier = (/^Identifier=(.+)$/m.exec(info) || [])[1];
	const team = (/^TeamIdentifier=(.+)$/m.exec(info) || [])[1];
	const flags = (/^CodeDirectory .*flags=\S*\(([^)]*)\)/m.exec(info) || [])[1] || '';

	if (identifier != IDENTIFIER) {
		throw new Error(`the forwarder's identifier is ${identifier}, expected ${IDENTIFIER}`);
	};
	if (!flags.split(',').includes('runtime')) {
		throw new Error('the forwarder is not signed with the hardened runtime');
	};
	if (!team || (team == 'not set')) {
		throw new Error('the forwarder has no Team ID (an ad-hoc signature)');
	};

	const entitlements = run('/usr/bin/codesign', [ '-d', '--entitlements', '-', '--xml', file ], { stdio: [ 'ignore', 'pipe', 'ignore' ] }).trim();

	if (entitlements) {
		throw new Error('the forwarder must carry no entitlements');
	};
	return { teamId: team };
};

/** Authenticode status of a Windows file (`Valid` when signed and trusted); '' when it can't be asked */
const authenticodeStatus = (file) => {
	const ps = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');

	try {
		return execFileSync(ps, [ '-NoProfile', '-NonInteractive', '-Command', '(Get-AuthenticodeSignature -LiteralPath $env:ANYTYPE_MCP_FILE).Status' ], {
			encoding: 'utf8', stdio: [ 'ignore', 'pipe', 'ignore' ], env: { ...process.env, ANYTYPE_MCP_FILE: file },
		}).trim();
	} catch (e) {
		return '';
	};
};

const signMac = (file, env, pkg) => {
	const identity = env.ANYTYPE_MCP_SIGN_IDENTITY || pkg.build?.mac?.identity;

	if (!identity) {
		throw new Error('no signing identity (build.mac.identity)');
	};

	// The same Developer ID identity the app is signed with; no entitlements (the app's plist is never passed on)
	run('/usr/bin/codesign', [ '--force', '--options', 'runtime', '--timestamp', '--identifier', IDENTIFIER, '--sign', identity, file ]);
	return verifyMac(file);
};

/**
 * The release workflows sign the exe in a step of its own, "Sign the forwarder Windows" (`node
 * scripts/prepare-forwarder.js`; with "Sign the Claude Desktop bundle" the only steps before packaging with the Azure
 * secrets), so the frontend build that runs this again later has none: an exe that already carries a valid,
 * timestamped signature of our publisher is kept as it is. Otherwise the existing hook signs it. `opt.signHook` /
 * `opt.winSignature`: injected by tests
 */
const signWindows = async (file, env, pkg, root, opt = {}) => {
	const hook = opt.signHook || require(path.join(root, 'electron', 'hook', 'sign.js')).default;
	const verifier = require(path.join(ROOT, 'electron', 'hook', 'verify-forwarder.js'));
	const check = () => verifier.verifyWindowsSignature(file, ...(opt.winSignature ? [ opt.winSignature, opt.winPublisher ] : []));

	try {
		check();
		log(`${path.basename(file)} is signed by our publisher already: kept`);
		return {};
	} catch (e) { /* not signed yet */ };

	// The existing hook, the same tool and secrets; `forwarder` tells it this is the early call. It throws
	// without the command line (which holds the client secret)
	await hook({ path: file, site: pkg.homepage || 'https://anytype.io', forwarder: true });

	// Valid, timestamped, and exactly our publisher
	check();
	return {};
};

/**
 * The build flavour decides everything (Q8), never what an earlier build left in the checkout:
 *
 * - Release flavour (`FORWARDER_SIGN_REQUIRED=1`, set by the release and nightly workflows): the inputs are
 *   update-ci.sh's — darwin-arm + darwin-amd (joined), dist/anytype-mcp.exe, linux-amd / linux-arm. The binary
 *   must be the release-namespace one and must be signed where the OS has signatures; anything else fails the
 *   build. `ANYTYPE_MCP_BIN` is refused.
 * - Development flavour (everything else): the input is `ANYTYPE_MCP_BIN` when set, else dist/anytype-mcp[.exe];
 *   the per-arch folders are ignored. The binary must be the development-namespace one (a release one turns
 *   the stdio routes off), and the build is never `signed`.
 *
 * @param {{ rootDir?: string, env?: Record<string, string | undefined>, platform?: string, arch?: string }} opt
 * @returns {Promise<null | { signed: boolean, namespace: 'release' | 'dev', rev: number, teamId?: string, files: Record<string, string>, bundleFile: string | null }>}
 *   `files`: metadata key (`darwin`, `win32-x64`, `linux-x64`, `linux-arm64`) → the binary shipped for it;
 *   `bundleFile`: the one packed into Anytype.mcpb (macOS and Windows). null: this build has no forwarder.
 */
const prepare = async (opt = {}) => {
	const root = opt.rootDir || ROOT;
	const env = opt.env || process.env;
	const platform = opt.platform || process.platform;
	const arch = opt.arch || process.arch;
	const exe = (platform == 'win32') ? `${NAME}.exe` : NAME;
	const dist = path.join(root, 'dist');
	const main = path.join(dist, exe);
	const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
	const release = (env.FORWARDER_SIGN_REQUIRED == '1');
	const files = {};

	fs.mkdirSync(dist, { recursive: true });

	if (release) {
		if (env.ANYTYPE_MCP_BIN) {
			throw new Error('ANYTYPE_MCP_BIN is for development builds; a release build takes the forwarder from the middleware archive');
		};

		if (platform == 'darwin') {
			const parts = [ path.join(root, 'darwin-arm', NAME), path.join(root, 'darwin-amd', NAME) ].filter(isFile);

			if (parts.length != 2) {
				throw new Error(`no ${exe} for both architectures: the middleware archives must contain anytype-mcp-release (update-ci.sh)`);
			};
			// S10: both slices must be the release one before they are joined. The marker search over the joined
			// file would find one release slice, and `version --json` runs only the host's
			for (const part of parts) {
				if (namespaceOf(part) != 'release') {
					throw new Error(`a release build needs the release-namespace forwarder for both architectures: ${path.relative(root, part)} is not one`);
				};
			};
			// Each slice's revision before they are joined, for the same reason
			const problem = revisionProblem(parts);

			if (problem) {
				throw new Error(`a release build needs one forwarder revision: ${problem}`);
			};
			// One universal file from heart's two; signed below
			run('/usr/bin/lipo', [ '-create', '-output', main, ...parts ]);
			fs.chmodSync(main, 0o755);
			files.darwin = main;
		} else
		if (platform == 'win32') {
			if (isFile(main)) {
				files['win32-x64'] = main;
			};
		} else {
			const amd = path.join(root, 'linux-amd', NAME);
			const arm = path.join(root, 'linux-arm', NAME);

			if (isFile(amd)) {
				files['linux-x64'] = amd;
			};
			if (isFile(arm)) {
				files['linux-arm64'] = arm;
			};
		};
		if (!Object.keys(files).length) {
			throw new Error(`no ${exe} for this build: the middleware archive must contain anytype-mcp-release (update-ci.sh)`);
		};
	} else {
		// A locally built forwarder: `go build -o <file> ./cmd/anytype-mcp` in anytype-heart
		if (env.ANYTYPE_MCP_BIN) {
			if (!isFile(env.ANYTYPE_MCP_BIN)) {
				throw new Error(`ANYTYPE_MCP_BIN is not a file: ${env.ANYTYPE_MCP_BIN}`);
			};
			fs.copyFileSync(env.ANYTYPE_MCP_BIN, main);
			fs.chmodSync(main, 0o755);
			log(`using ${env.ANYTYPE_MCP_BIN}`);
		};
		if (!isFile(main)) {
			log('no forwarder binary: the stdio routes are off in this build (run ./update.sh, or set ANYTYPE_MCP_BIN)');
			return null;
		};
		files[(platform == 'darwin') ? 'darwin' : ((platform == 'win32') ? 'win32-x64' : `linux-${arch}`)] = main;
	};

	/**
	 * A development build that can't use its forwarder ships none: the staged copy dist/<exe> is removed (D1B-03),
	 * or the packaging lists would ship it next to `forwarder: null`. Never the caller's ANYTYPE_MCP_BIN itself
	 */
	const discard = (why) => {
		const own = !!env.ANYTYPE_MCP_BIN && sameFile(env.ANYTYPE_MCP_BIN, main);

		if (!own) {
			fs.rmSync(main, { force: true });
		};
		log(`${why}: not used by this development build (the stdio routes are off); dist/${exe} ${own ? 'kept (it is ANYTYPE_MCP_BIN)' : 'removed'}`);
		return null;
	};

	const list = Object.values(files);
	const namespaces = [ ...new Set(list.flatMap(f => slicesOf(f).map(m => m.namespace))) ];

	if ((namespaces.length != 1) && release) {
		throw new Error('the forwarder binaries of this build have different namespaces');
	};
	if (namespaces.length != 1) {
		return discard('the forwarder has slices of different namespaces');
	};

	const namespace = namespaces[0];

	if (release && (namespace != 'release')) {
		throw new Error('a release build needs the release-namespace forwarder (anytype-mcp-release)');
	};
	if (!release && (namespace != 'dev')) {
		// Never the production key folder or the production stable copy from a build that isn't a release
		return discard(`dist/${exe} is a release-namespace forwarder`);
	};

	const problem = revisionProblem(list);

	if (problem && release) {
		throw new Error(`the release forwarder can't be shipped: ${problem}`);
	};
	if (problem) {
		return discard(problem);
	};

	const rev = slicesOf(list[0])[0].rev;
	// One of them runs on this machine (macOS: the universal file; Linux: this architecture's)
	const versions = list.map(versionOf).filter(Boolean);
	const version = versions[0];

	if (!version || versions.some(v => (v.rev != rev) || (v.namespace != namespace))) {
		throw new Error('`anytype-mcp version --json` does not agree with the binary (revision or namespace)');
	};

	let teamId;

	// Linux has nothing to sign
	if (release && (platform != 'linux')) {
		try {
			const res = (platform == 'darwin') ? signMac(main, env, pkg) : await signWindows(main, env, pkg, root, opt);

			teamId = res.teamId;
		} catch (e) {
			throw new Error(`the release forwarder could not be signed: ${e.message}`);
		};
	};

	for (const file of list) {
		fs.chmodSync(file, 0o755);
	};

	log(`${exe}: rev ${version.rev}, ${namespace} namespace, ${release ? 'release build' : 'development build'}`);
	return {
		signed: release, namespace, rev: version.rev, ...(teamId ? { teamId } : {}), files,
		bundleFile: (platform == 'linux') ? null : main,
	};
};

module.exports = { prepare, verifyMac, authenticodeStatus, namespaceOf, probeEnv, sha256, NAME, IDENTIFIER, MIN_FORWARDER_REV };

if (require.main === module) {
	prepare().then(info => {
		if (info) {
			console.log(JSON.stringify({ ...info, files: Object.keys(info.files) }));
		};
	}).catch((e) => {
		console.error('[prepare-forwarder]', e.message);
		process.exit(1);
	});
};
