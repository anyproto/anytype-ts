/**
 * S12 (Windows only): the REAL forwarder's store-folder rule against folders the desktop created — the check
 * Q17's unit test fakes. A scratch profile whose access list hands `Users` an inheritable read entry (as a
 * home outside `C:\Users` often does); the real Node env runs `ensureInstalled` (`.anytype` and `bin` through
 * `protectNewDir`, then S5's "who may replace the copy" query), writes the endpoint file (`syncEndpoint`), and
 * the forwarder's own `endpoint` verb, run on the stable copy, must accept both. Without the protected list it
 * answers `denied` (heart N9).
 *
 * Opt-in: runs on win32 with ANYTYPE_MCP_BIN set (CI: the packaged exe, right after it was verified). Needs no
 * heart, opens no port, and touches nothing outside its scratch folder.
 */
import { execFileSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { afterAll, describe, expect, test } from 'vitest';
import { bundled, endpointVerdict, ensureInstalled, privateOnWindows, stableDir } from './forwarder';
import { syncEndpoint } from './endpoint';
import { nodeEnv, tempDir } from './testEnv';

const BIN = process.env.ANYTYPE_MCP_BIN || '';
const enabled = (process.platform == 'win32') && !!BIN && fs.existsSync(BIN);
const USERS = '*S-1-5-32-545';

let dir = '';

afterAll(() => {
	if (dir) {
		fs.rmSync(dir, { recursive: true, force: true });
	};
});

describe.skipIf(!enabled)('S12: the real anytype-mcp on Windows, in folders the desktop created', () => {
	test('D1-05 / S12: `.anytype` and `bin` get the protected list, the stable copy passes the ACL check, and the real forwarder accepts the endpoint file the desktop wrote', async () => {
		dir = tempDir('aic-win-');

		const home = path.join(dir, 'home');
		const systemRoot = process.env.SystemRoot || 'C:\\Windows';
		const icacls = path.join(systemRoot, 'System32', 'icacls.exe');

		fs.mkdirSync(home);
		fs.mkdirSync(path.join(dir, 'app', 'dist'), { recursive: true });
		// A profile folder that every local user may read, inherited by whatever is created in it
		execFileSync(icacls, [ home, '/grant', `${USERS}:(OI)(CI)RX` ], { stdio: 'pipe' });

		// The forwarder as a build ships it, with the metadata scripts/build-mcp.js would write for it
		const exe = path.join(dir, 'app', 'dist', 'anytype-mcp.exe');

		fs.copyFileSync(BIN, exe);

		const version = JSON.parse(execFileSync(exe, [ 'version', '--json' ], { encoding: 'utf8', env: { SystemRoot: systemRoot, USERPROFILE: home, HOME: home } }));
		const release = (version.namespace == 'release');
		const meta = JSON.stringify({
			signed: release,
			forwarder: { rev: version.rev, namespace: release ? 'release' : 'dev', sha256: { 'win32-x64': crypto.createHash('sha256').update(fs.readFileSync(exe)).digest('hex') } },
			mcpb: null,
		});
		const env = nodeEnv(home, { appRoot: path.join(dir, 'app'), vars: { SystemRoot: systemRoot, PATH: process.env.PATH || '' }, buildMeta: () => meta });

		expect(bundled(env)).toBe(exe);

		// The desktop's own path: both folders created here, each with the protected list at once
		const installed = await ensureInstalled(env);

		expect(installed).toMatchObject({ ok: true, installed: true });

		const bin = stableDir(env);
		const copy = path.join(bin, 'anytype-mcp.exe');

		expect(fs.existsSync(copy)).toBe(true);
		for (const folder of [ path.join(home, '.anytype'), bin ]) {
			const list = execFileSync(icacls, [ folder ], { encoding: 'utf8' });

			// No inherited entry, and nothing for Users
			expect(list).not.toMatch(/\(I\)/);
			expect(list).not.toMatch(/BUILTIN\\Users|S-1-5-32-545/i);
		};

		// S5 on the real ACLs: the folders and the copy pass; a copy that Users may modify does not
		expect(await privateOnWindows(env, [ path.join(home, '.anytype'), bin, copy ])).toBe(true);

		const loose = path.join(dir, 'loose');

		fs.mkdirSync(loose);
		fs.copyFileSync(exe, path.join(loose, 'anytype-mcp.exe'));
		execFileSync(icacls, [ loose, '/grant', `${USERS}:(OI)(CI)M` ], { stdio: 'pipe' });
		expect(await privateOnWindows(env, [ loose, path.join(loose, 'anytype-mcp.exe') ])).toBe(false);

		// D1R2-E (D1B-06): a private `bin` and exe under a `.anytype` that Users may change, then under a home that lets
		// Users replace its children: Anytype refuses the path before it runs either verb
		const ran: string[] = [];
		const run = env.run;

		env.run = (file, args, opts) => {
			ran.push(file);
			return run(file, args, opts);
		};

		const runs = (): number => ran.filter(f => f == copy).length;
		const before = runs();
		const anytype = path.join(home, '.anytype');

		execFileSync(icacls, [ anytype, '/grant', `${USERS}:(CI)M` ], { stdio: 'pipe' });
		execFileSync(icacls, [ bin, '/inheritance:r' ], { stdio: 'pipe' });
		expect(await privateOnWindows(env, [ bin, copy ])).toBe(true);
		expect(await ensureInstalled(env)).toMatchObject({ ok: false, error: { category: 'installFailed' } });
		execFileSync(icacls, [ anytype, '/remove:g', USERS ], { stdio: 'pipe' });
		execFileSync(icacls, [ home, '/grant', `${USERS}:(DC)` ], { stdio: 'pipe' });
		expect(await ensureInstalled(env)).toMatchObject({ ok: false, error: { category: 'installFailed' } });
		execFileSync(icacls, [ home, '/remove:g', USERS ], { stdio: 'pipe' });
		expect(runs()).toBe(before);

		// heart's own folder rule, with the packaged exe: the endpoint the desktop writes is found, through the stable copy
		const state = { localApi: { enabled: true, port: 39999 }, bind: { addr: '127.0.0.1:39999', success: true }, account: true };

		expect(await syncEndpoint(env, state, null)).toBe(39999);
		expect(await endpointVerdict(env, copy)).toEqual({ ok: true, port: 39999 });
	}, 180000);
});
