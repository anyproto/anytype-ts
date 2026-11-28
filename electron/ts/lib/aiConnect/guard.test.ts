/**
 * Guards for the switch from the Node connector to the Go forwarder (anytype-mcp-plan §7.1, §4.4, §4.5):
 * nothing in the feature starts Electron in Node mode, nothing of the Node connector is left, the forwarder
 * is on every packaging list, and both workflows sign it before the frontend build and verify it afterwards.
 */
import fs from 'fs';
import path from 'path';
import { describe, expect, test, vi } from 'vitest';
import YAML from 'yaml';

const ROOT = path.resolve(__dirname, '../../../..');
// Built from parts, so this file doesn't contain what it looks for
const RUN_AS_NODE = [ 'ELECTRON', 'RUN', 'AS', 'NODE' ].join('_');
const SKIP_DIRS = new Set([ 'node_modules', '.git', 'img', 'font', 'proto', 'pb' ]);
const TEXT = /\.(ts|tsx|js|cjs|mjs|json|sh|md|yml|yaml|html|scss|plist|txt)$/;

const walk = (dir: string): string[] => {
	let ret: string[] = [];

	for (const it of fs.readdirSync(dir, { withFileTypes: true })) {
		if (it.isDirectory()) {
			if (!SKIP_DIRS.has(it.name)) {
				ret = ret.concat(walk(path.join(dir, it.name)));
			};
		} else
		if (it.isFile() && TEXT.test(it.name)) {
			ret.push(path.join(dir, it.name));
		};
	};
	return ret;
};

const read = (rel: string): string => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const stepsOf = (file: string): any[] => {
	const jobs: any[] = Object.values(YAML.parse(read(file)).jobs);
	return jobs.find(j => (j.steps || []).some((s: any) => s.name == 'Build frontend')).steps;
};

describe('no Electron-as-Node anywhere in the feature', () => {
	test(`${[ 'ELECTRON', 'RUN', 'AS', 'NODE' ].join('_')} appears in no file under electron/, src/ and scripts/ (nor in the workflows or the update scripts)`, () => {
		const files = [
			...walk(path.join(ROOT, 'electron')), ...walk(path.join(ROOT, 'src')), ...walk(path.join(ROOT, 'scripts')), ...walk(path.join(ROOT, '.github')),
			path.join(ROOT, 'package.json'), path.join(ROOT, 'update.sh'), path.join(ROOT, 'update-ci.sh'),
		];
		// A minified bundle can be far larger than any source file: nothing here should be
		const hits = files.filter(f => (fs.statSync(f).size < 16 * 1024 * 1024) && fs.readFileSync(f, 'utf8').includes(RUN_AS_NODE));

		expect(files.length).toBeGreaterThan(500);
		expect(hits.map(f => path.relative(ROOT, f))).toEqual([]);
	});

	test('the Node connector is gone: no wrapper, no vendored proxy, no script in the bundle\'s sources, no run-as-Node command builder', () => {
		expect(fs.existsSync(path.join(ROOT, 'vendor', 'anytype-mcp'))).toBe(false);
		expect(fs.readdirSync(path.join(ROOT, 'electron', 'mcp')).sort()).toEqual([ 'manifest.json', 'skill-preamble.md' ]);
		for (const gone of [ 'proxy.ts', 'keyFile.ts', 'connect.test.ts', 'keyFile.test.ts', 'proxy.test.ts' ]) {
			expect(fs.existsSync(path.join(__dirname, gone)), gone).toBe(false);
		};

		const sources = walk(__dirname).filter(f => !f.endsWith('.test.ts')).map(f => fs.readFileSync(f, 'utf8')).join('\n');

		expect(sources).not.toMatch(/wrapperCommand|plainProxyCommand|connect\.mjs|cli\.mjs|OPENAPI_MCP_HEADERS|ANYTYPE_MCP_FILES_DIR|ANYTYPE_AI_CONNECT_DIR/);
		// No command Anytype writes starts Anytype's own executable
		expect(sources).not.toMatch(/command:\s*env\.execPath/);
		expect(read('scripts/build-mcp.js')).not.toMatch(/\.mjs|vendor['", ]+anytype-mcp/);
		expect(JSON.parse(read('electron/mcp/manifest.json')).server).toEqual({
			type: 'binary', entry_point: 'server/anytype-mcp',
			mcp_config: {
				command: '${__dirname}/server/anytype-mcp', args: [ 'serve', '--tier', 'full' ],
				env: { ANYTYPE_API_KEY: '${user_config.api_key}', ANYTYPE_MCP_FILES_DIR: '${user_config.files_dir}' },
			},
		});
	});

	test('nothing passes --files-dir: on the full tier the forwarder uses its own fresh temp folder per process', () => {
		const sources = walk(__dirname).filter(f => !f.endsWith('.test.ts')).map(f => fs.readFileSync(f, 'utf8')).join('\n');

		expect(sources).not.toContain('--files-dir');
		expect(read('scripts/build-mcp.js')).not.toContain('--files-dir');
	});
});

describe('packaging lists (§4.5)', () => {
	const pkg = JSON.parse(read('package.json'));
	const deps: any[] = JSON.parse(read('package.deps.json'));

	test('the forwarder is packaged and asar-unpacked through the CI path (build.files) and the local path (package.deps.json regenerates build.files)', () => {
		for (const file of [ 'dist/anytype-mcp', 'dist/anytype-mcp.exe' ]) {
			expect(pkg.build.files, file).toContain(file);
			expect(pkg.build.asarUnpack, file).toContain(file);
			expect(deps, file).toContain(file);
		};
		// The Claude bundle and the skill
		expect(pkg.build.files).toContain('dist/mcp/**/*');
		expect(pkg.build.asarUnpack).toContain('dist/mcp/**/*');
		// The metadata is packed INTO app.asar (electron/json), never unpacked
		expect(pkg.build.files).toContain('electron/json/*');
		expect(pkg.build.asarUnpack.some((it: string) => it.startsWith('electron/json'))).toBe(false);
	});

	test('macOS: signIgnore keeps the pre-signed forwarder; the afterSign hook only verifies', () => {
		const ignore: string[] = pkg.build.mac.signIgnore;
		const packed = '/x/Anytype.app/Contents/Resources/app.asar.unpacked/dist/anytype-mcp';

		expect(ignore.some(re => new RegExp(re).test(packed))).toBe(true);
		// Only that one file: the helper next to it is still signed by electron-builder
		expect(ignore.some(re => new RegExp(re).test('/x/Anytype.app/Contents/Resources/app.asar.unpacked/dist/anytypeHelper'))).toBe(false);
		expect(pkg.build.afterSign).toBe('./electron/hook/aftersign.js');
		expect(read('electron/hook/aftersign.js')).toMatch(/verifyPackaged\(context\)[\s\S]*ELECTRON_SKIP_NOTARIZE[\s\S]*notarize\(/);
	});

	test('S4: the sign hook takes electron-builder\'s real (configuration, packager) arguments', async () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const hook = require('../../../hook/sign.js');
		const original = hook.runner;
		const ran: { file: string; args: string[] }[] = [];
		const skip = process.env.ELECTRON_SKIP_NOTARIZE;

		delete process.env.ELECTRON_SKIP_NOTARIZE;
		hook.runner = async (file: string, args: string[]) => {
			ran.push({ file, args });
			return { code: 0, stdout: 'ok', stderr: '' };
		};
		vi.spyOn(console, 'log').mockImplementation(() => {});
		try {
			// windowsSignToolManager: executor({ ...taskConfiguration, computeSignToolArgs }, this.packager)
			const configuration = { path: 'C:\\b\\dist\\win-unpacked\\Anytype.exe', site: 'https://anytype.io', hash: 'sha256', isNest: false, computeSignToolArgs: () => [] as string[] };
			const packager = { appInfo: {} };

			await expect(hook.default(configuration, packager)).resolves.toBe('ok');
			expect(ran).toHaveLength(1);
			expect(ran[0].file).toBe('AzureSignTool.exe');
			expect(ran[0].args[ran[0].args.length - 1]).toBe('C:\\b\\dist\\win-unpacked\\Anytype.exe');
			// The declared shape is CustomWindowsSign: two parameters, the second unused
			expect(hook.default.length).toBe(2);
		} finally {
			hook.runner = original;
			vi.restoreAllMocks();
			if (skip !== undefined) {
				process.env.ELECTRON_SKIP_NOTARIZE = skip;
			};
		};
	});

	test('Windows: the sign hook signs anytype-mcp.exe once (the early call) and skips it when electron-builder asks again', async () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const hook = require('../../../hook/sign.js');
		const sign = hook.default;
		const original = hook.runner;
		const ran: { file: string; args: string[] }[] = [];
		const runner = async (file: string, args: string[]) => {
			ran.push({ file, args });
			return { code: 0, stdout: 'ok', stderr: '' };
		};
		const skip = process.env.ELECTRON_SKIP_NOTARIZE;

		delete process.env.ELECTRON_SKIP_NOTARIZE;
		hook.runner = runner;
		vi.spyOn(console, 'log').mockImplementation(() => {});
		try {
			await sign({ path: 'C:\\b\\dist\\win-unpacked\\resources\\app.asar.unpacked\\dist\\anytype-mcp.exe', site: 'https://anytype.io' });
			expect(ran).toEqual([]);
			await sign({ path: 'C:\\b\\dist\\anytype-mcp.exe', site: 'https://anytype.io', forwarder: true });
			await sign({ path: 'C:\\b\\dist\\win-unpacked\\Anytype.exe', site: 'https://anytype.io' });
			expect(ran).toHaveLength(2);
			// The same AzureSignTool call for both: digest, RFC 3161 timestamp, key vault; an argument array, no shell
			expect(ran[0].file).toBe('AzureSignTool.exe');
			expect(ran[0].args.slice(0, 9)).toEqual([ 'sign', '-du', 'https://anytype.io', '-fd', 'sha384', '-td', 'sha384', '-tr', 'http://timestamp.digicert.com' ]);
			expect(ran[0].args[ran[0].args.length - 1]).toBe('C:\\b\\dist\\anytype-mcp.exe');
			expect(ran[1].args.slice(0, -1)).toEqual(ran[0].args.slice(0, -1));
		} finally {
			hook.runner = original;
			vi.restoreAllMocks();
			if (skip !== undefined) {
				process.env.ELECTRON_SKIP_NOTARIZE = skip;
			};
		};
	});

	test('Linux: beforeBuild copies the forwarder per architecture in the release flavour only; macOS keeps its one universal, pre-signed file', () => {
		const hook = read('electron/hook/beforebuild.js');

		expect(hook).toMatch(/if \(\(platform\.name == 'linux'\) && \(process\.env\.FORWARDER_SIGN_REQUIRED == '1'\)\) \{\s*files\.push\('anytype-mcp'\);/);
	});

	test('generated files stay out of git', () => {
		const ignore = read('.gitignore').split('\n');

		for (const it of [ 'dist/mcp/', 'dist/anytype-mcp', 'dist/anytype-mcp.exe', 'electron/json/aiConnect.build.json' ]) {
			expect(ignore, it).toContain(it);
		};
	});
});

describe('where the forwarder comes from, and when it is signed', () => {
	test('update.sh takes the development-namespace member, update-ci.sh the release one; both store it as anytype-mcp[.exe]', () => {
		const dev = read('update.sh');
		const ci = read('update-ci.sh');

		expect(dev).toContain('mv -fv "anytype-mcp-dev$mcp_ext" "$folder/anytype-mcp$mcp_ext"');
		expect(dev).not.toMatch(/mv [^\n]*anytype-mcp-release/);
		expect(ci).toContain('mv -fv "anytype-mcp-release$MCP_EXT" "$FOLDER/anytype-mcp$MCP_EXT"');
		expect(ci).not.toMatch(/mv [^\n]*anytype-mcp-dev/);
		// A release can't be built from an archive without the forwarder
		expect(ci).toMatch(/if \[\[ ! -f "anytype-mcp-release\$MCP_EXT" \]\]; then[\s\S]*?exit 1/);
	});

	test.each([ '.github/workflows/build.yml', '.github/workflows/nightly.yml' ])('%s: the macOS identity is imported and the forwarder signed before the frontend build; the bundle is signed; the packages are verified', file => {
		const steps = stepsOf(file);
		const at = (name: string) => steps.findIndex(s => s.name == name);
		const build = steps[at('Build frontend')];

		expect(at('Import macOS certificates')).toBeGreaterThan(-1);
		expect(at('Import macOS certificates')).toBeLessThan(at('Build frontend'));
		expect(at('Prepare .mcpb signing files')).toBeLessThan(at('Build frontend'));
		expect(at('Remove .mcpb signing files')).toBe(at('Build frontend') + 1);
		// The same Azure secrets the packaging step has, for the early call of the sign hook
		for (const k of [ 'MCPB_SIGN_REQUIRED', 'MCPB_SIGN_CERT', 'MCPB_SIGN_KEY', 'MCPB_SIGN_FINGERPRINT' ]) {
			expect(build.env[k], k).toBeTruthy();
		};
		// Q11: the Azure secrets reach "Build frontend" on Windows only (the one job whose build signs with them)
		for (const k of [ 'AZURE_KEY_VAULT_URI', 'AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET', 'AZURE_CERT_NAME', 'AZURE_TENANT_ID' ]) {
			expect(build.env[k], k).toBe(`\${{ startsWith(matrix.os, 'windows-') && secrets.${k} || '' }}`);
		};
		expect(build.env.FORWARDER_SIGN_REQUIRED).toBe('1');

		// After electron-builder: S2 (macOS) and S4 (Windows) as build steps that fail on a mismatch
		const pack = Math.max(at('Package and publish Mac OS'), at('Package and publish Other'));
		const mac = steps[at('Verify the packaged forwarder Mac OS')];
		const win = steps[at('Verify the packaged forwarder Windows')];
		const linux = steps[at('Verify the packaged forwarder Linux')];

		for (const s of [ mac, win, linux ]) {
			expect(steps.indexOf(s)).toBeGreaterThan(pack);
			expect(s['continue-on-error']).toBeUndefined();
			expect(String(s.if)).not.toContain('refs/tags');
			expect(s.run).toContain('electron/hook/verify-forwarder.js');
			expect(s.run).toContain('--require-signed');
		};
		expect(mac.if).toContain("startsWith(matrix.os, 'macos-')");
		expect(mac.run).toContain('codesign --verify --strict');
		// Q10: nothing pipes codesign into `grep -q` (under pipefail the early exit is a SIGPIPE failure, 141); the
		// identifier, the runtime flag and the entitlements are checked by verify-forwarder.js
		for (const s of [ mac, win, linux ]) {
			expect(s.run).not.toMatch(/\|\s*grep\s+-\w*q/);
		};
		expect(mac.run).toContain('app.asar.unpacked/dist/anytype-mcp');
		expect(mac.run).toContain('set -euo pipefail');
		// D1B-02: each package is verified (and smoked) as its own architecture, never the runner's
		expect(mac.run).toMatch(/verify-forwarder\.js "\$app" [^\n]*--arch "\$arch"\n/);
		expect(mac.run).toMatch(/dist\/mac-arm64\/\*\) arch=arm64 ;;\n\s*dist\/mac\/\*\) arch=x64 ;;\n\s*\*\) [^\n]*exit 1 ;;/);
		expect(win.if).toContain("startsWith(matrix.os, 'windows-')");
		expect(win.run).toContain('Get-AuthenticodeSignature');
		expect(win.run).toContain("$sig.Status -ne 'Valid'");
		expect(win.run).toContain('app.asar.unpacked/dist/anytype-mcp.exe');
		// The afterSign hook requires a signed forwarder too
		for (const name of [ 'Package and publish Mac OS', 'Package and publish Other' ]) {
			expect(steps[at(name)].env.FORWARDER_SIGN_REQUIRED).toBe('1');
		};
	});

	test.each([ '.github/workflows/build.yml', '.github/workflows/nightly.yml' ])('Q9: %s verifies exactly the Linux package its job builds, and Linux is gated in afterPack before anything is published', file => {
		const steps = stepsOf(file);
		const pack: string = steps.find(s => s.name == 'Package and publish Other').run;
		const verify: string = steps.find(s => s.name == 'Verify the packaged forwarder Linux').run;
		// A bare `--linux` on the x64 runner builds x64 only: dist/linux-unpacked
		const built = /--linux\b(?![^\n]*--arm64)/.test(pack) ? [ 'dist/linux-unpacked --require-signed --arch x64' ] : [];
		const checked = [ ...verify.matchAll(/verify-forwarder\.js (dist\/\S+ [^\n]*)/g) ].map(m => m[1].trim());

		expect(checked).toEqual(built);
		expect(read('electron/hook/afterpack.js')).toMatch(/async function \(context\) \{\s*(\/\/[^\n]*\n\s*)*await require\('\.\/verify-forwarder\.js'\)\.verifyLinux\(context\);[\s\S]*ELECTRON_SKIP_SENTRY/);
	});

	test('Q12: a release requires the signed bundle; a nightly does not, unless the one switch (NIGHTLY_MCPB_SIGN_REQUIRED) is set', () => {
		const release = stepsOf('.github/workflows/build.yml');
		const nightly = stepsOf('.github/workflows/nightly.yml');
		const step = (steps: any[], name: string) => steps.find(s => s.name == name);

		expect(step(release, 'Verify the packaged forwarder Mac OS').run).toContain('--require-bundle');
		expect(step(release, 'Verify the packaged forwarder Windows').run).toContain('--require-bundle');
		expect(step(release, 'Package and publish Mac OS').env.MCPB_SIGN_REQUIRED).toBe('1');
		for (const name of [ 'Verify the packaged forwarder Mac OS', 'Verify the packaged forwarder Windows' ]) {
			expect(step(nightly, name).run).not.toContain('--require-bundle');
		};
		expect(step(nightly, 'Build frontend').env.MCPB_SIGN_REQUIRED).toBe("${{ !startsWith(matrix.os, 'ubuntu-') && vars.NIGHTLY_MCPB_SIGN_REQUIRED == '1' && '1' || '' }}");
		expect(step(nightly, 'Build frontend').env.MCPB_SIGN_CERT).toContain("steps.mcpb.outputs.ready == '1'");

		const prepare = step(nightly, 'Prepare .mcpb signing files');

		// No key file on the Linux job (it builds no bundle)
		expect(prepare.if).toContain("!startsWith(matrix.os, 'ubuntu-')");
	});

	test('S11: the nightly .mcpb signature follows the switch, and the signing key reaches only the jobs that sign a bundle', () => {
		const NOT_LINUX = "!startsWith(matrix.os, 'ubuntu-')";
		const SWITCH = "vars.NIGHTLY_MCPB_SIGN_REQUIRED == '1'";
		const nightly = stepsOf('.github/workflows/nightly.yml');
		const prepare = nightly.find(s => s.name == 'Prepare .mcpb signing files');

		// With the switch off no PEM is written, whatever secrets exist: `ready` is never set, so no path is passed
		expect(prepare.if).toBe(`\${{ ${NOT_LINUX} && ${SWITCH} }}`);
		expect(prepare.run).not.toContain('exit 0');
		expect(prepare.run).toMatch(/-z "\$MCPB_KEY_PEM"[\s\S]*exit 1[\s\S]*key\.pem[\s\S]*ready=1/);
		for (const k of [ 'MCPB_SIGN_CERT', 'MCPB_SIGN_KEY', 'MCPB_SIGN_FINGERPRINT' ]) {
			expect(nightly.find(s => s.name == 'Build frontend').env[k], k).toMatch(/^\$\{\{ steps\.mcpb\.outputs\.ready == '1' && /);
		};

		for (const file of [ '.github/workflows/build.yml', '.github/workflows/nightly.yml' ]) {
			for (const s of stepsOf(file)) {
				const text = JSON.stringify(s);
				const guard = String(s.if || '');
				const offLinux = guard.includes(NOT_LINUX) || /startsWith\(matrix\.os, '(macos|windows)-'\)/.test(guard) && !guard.includes('!startsWith(matrix.os, \'macos-\')');

				// A step that reads the signing secrets or writes the PEMs never runs on ubuntu
				if (/secrets\.MCPB_SIGN_(CERT|KEY)\b/.test(text) || /mcpb-sign\/(cert|key)\.pem/.test(String(s.run || ''))) {
					expect(offLinux, `${file}: ${s.name}`).toBe(true);
				};
				// No MCPB_SIGN_* value reaches a step on ubuntu: the step is off there, or the value is empty there
				for (const [ k, v ] of Object.entries(s.env || {}) as [ string, string ][]) {
					if (!k.startsWith('MCPB_SIGN_') || offLinux) {
						continue;
					};
					expect(String(v).includes(NOT_LINUX) || String(v).includes("steps.mcpb.outputs.ready == '1'"), `${file}: ${s.name}: ${k}`).toBe(true);
				};
			};
		};
	});

	test.each([ '.github/workflows/build.yml', '.github/workflows/nightly.yml' ])('S12: %s runs the real store-folder check on the Windows job, with the forwarder the build just signed', file => {
		const steps = stepsOf(file);
		const step = steps.find(s => s.name == 'Check the forwarder\'s store folders Windows');

		expect(step.if).toBe("${{ startsWith(matrix.os, 'windows-') }}");
		expect(step['continue-on-error']).toBeUndefined();
		expect(step.env.ANYTYPE_MCP_BIN).toBe('dist/anytype-mcp.exe');
		expect(step.run).toContain('bunx vitest run electron/ts/lib/aiConnect/forwarder.windows.integration.test.ts');
		// A missing exe fails the step (the test itself would only be skipped), and so does a failing test
		expect(step.run).toMatch(/Test-Path[\s\S]*exit 1[\s\S]*vitest[\s\S]*\$LASTEXITCODE -ne 0/);

		// The test is the Windows one and runs only there, with the binary given
		const text = read('electron/ts/lib/aiConnect/forwarder.windows.integration.test.ts');

		expect(text).toMatch(/process\.platform == 'win32'\) && !!BIN/);
		expect(text).toContain('ensureInstalled(env)');
		expect(text).toMatch(/syncEndpoint\(env[\s\S]*endpointVerdict\(env, copy\)/);
	});

	test.each([ '.github/workflows/build.yml', '.github/workflows/nightly.yml' ])('T4: %s runs the Windows store check after the forwarder was signed and before any step that publishes', file => {
		const steps = stepsOf(file);
		const at = (name: string) => steps.findIndex(s => s.name == name);
		const check = at('Check the forwarder\'s store folders Windows');
		const publishing = steps.map((s, i) => /--publish always/.test(String(s.run || '')) ? i : -1).filter(i => i >= 0);

		expect(check).toBeGreaterThan(at('Build frontend'));
		expect(publishing.length).toBeGreaterThan(0);
		for (const i of publishing) {
			expect(check, steps[i].name).toBeLessThan(i);
		};
		// Still the bytes that ship: the package is compared with the build's metadata in afterSign and again afterwards
		expect(at('Verify the packaged forwarder Windows')).toBeGreaterThan(Math.max(...publishing));
		expect(read('scripts/prepare-forwarder.js')).toMatch(/files\['win32-x64'\] = main/);
	});

	test('the release workflow no longer ships the loose forwarder next to the installers', () => {
		const cleanup = stepsOf('.github/workflows/build.yml').find(s => s.name == 'Cleanup artifacts Windows');

		expect(cleanup.run).toContain('rm dist/anytype-mcp.exe');
	});
});
