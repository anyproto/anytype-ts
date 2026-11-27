/**
 * S12 (Windows only): the REAL forwarder's store-folder rule against folders the desktop created — the check
 * Q17's unit test fakes. A scratch profile whose access list hands `Users` an inheritable read entry (as a
 * home outside `C:\Users` often does); the real Node env runs `ensureInstalled` (`.anytype` and `bin` through
 * `protectNewDir`, then S5's "who may replace the copy" query), and the forwarder's own `key set` / `key check`
 * must accept the store. Without the protected list every key verb there answers `store: denied` (heart N9).
 *
 * Opt-in: runs on win32 with ANYTYPE_MCP_BIN set (CI: the packaged exe, right after it was verified). Needs no
 * heart, opens no port, and touches nothing outside its scratch folder.
 */
import { execFileSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { afterAll, describe, expect, test } from 'vitest';
import { bundled, ensureInstalled, privateOnWindows, stableDir } from './forwarder';
import { keyCheck, keySet } from './keyStore';
import { nodeEnv, tempDir } from './testEnv';

const BIN = process.env.ANYTYPE_MCP_BIN || '';
const enabled = (process.platform == 'win32') && !!BIN && fs.existsSync(BIN);
const USERS = '*S-1-5-32-545';
const ID = 'other-0a1b2c3d';

let dir = '';

afterAll(() => {
	if (dir) {
		fs.rmSync(dir, { recursive: true, force: true });
	};
});

describe.skipIf(!enabled)('S12: the real anytype-mcp on Windows, in folders the desktop created', () => {
	test('S12: `.anytype` and `bin` get the protected list, the stable copy passes the ACL check, and `key set` / `key check` answer store: ok', async () => {
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

		// S5 on the real ACLs: the folder and the copy pass; a copy that Users may modify does not
		expect(await privateOnWindows(env, bin, copy)).toBe(true);

		const loose = path.join(dir, 'loose');

		fs.mkdirSync(loose);
		fs.copyFileSync(exe, path.join(loose, 'anytype-mcp.exe'));
		execFileSync(icacls, [ loose, '/grant', `${USERS}:(OI)(CI)M` ], { stdio: 'pipe' });
		expect(await privateOnWindows(env, loose, path.join(loose, 'anytype-mcp.exe'))).toBe(false);

		// heart's own folder rule, with the packaged exe: the store is usable
		const key = `SENTINEL-win-${crypto.randomBytes(12).toString('hex')}`;
		const set = await keySet(env, ID, 'absent', { key, account: 'acc-windows-test', port: 39999, tier: 'large' });

		expect(set).toMatchObject({ ok: true, rev: 1 });
		expect(await keyCheck(env, ID)).toMatchObject({ present: true, rev: 1, account: 'acc-windows-test', port: 39999, tier: 'large' });

		const raw = await env.run(exe, [ 'key', 'check', '--connection', ID ], { timeout: 40000, env: { HOME: home, USERPROFILE: home } });

		expect(raw.code).toBe(0);
		expect(JSON.parse(String(raw.stdout).trim())).toMatchObject({ present: true, store: 'ok' });
	}, 180000);
});
