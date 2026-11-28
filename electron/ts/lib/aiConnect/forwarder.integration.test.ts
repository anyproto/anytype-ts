/**
 * The REAL forwarder (heart's cmd/anytype-mcp, Rev 6) against a throwaway heart, driven by the real service on a
 * scratch home: the endpoint file the desktop writes, the preflight (`anytype-mcp endpoint`) on the stable copy,
 * Other app's Command setup with the key only in the entry's `env` → `serve` (initialize, tools/list, a tool
 * call; heart's isActive turns true) → a port move and the API switched off (nothing is sent) → Disconnect,
 * RevokeApp → heart rejects the key. And an unsafe Anytype folder: the real forwarder refuses, the stdio plan too.
 *
 * Runs only when the binaries are given (it starts a heart process):
 *
 *   ANYTYPE_MCP_BIN=<built anytype-mcp>   cd anytype-heart && CGO_ENABLED=0 go build -o <file> ./cmd/anytype-mcp
 *   TESTHEART_BIN=<testdata/testheart>    heart's cmd/evalheart plus the key's hash and RevokeApp; built inside an
 *                                         anytype-heart checkout with `go build -overlay` (see testdata/testheart/main.go)
 *   HEART_BIN=<a cmd/grpcserver build>    e.g. dist/anytypeHelper
 *
 * The heart listens on a port the kernel picked (never 31009); nothing outside the scratch folders is touched.
 */
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import net from 'net';
import path from 'path';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: () => '/nonexistent', getAppPath: () => '/nonexistent', getVersion: () => '0.0.0', getFileIcon: vi.fn(), getApplicationInfoForProtocol: vi.fn() }, shell: { openExternal: vi.fn(), showItemInFolder: vi.fn() } }));
vi.mock('electron-util', () => ({ fixPathForAsarUnpack: (p: string) => p }));

import { AiConnectService } from './index';
import { liveApiListening } from './validate';
import { modeOf, nodeEnv, tempDir } from './testEnv';
import type { Env, RunOptions } from './types';

const BIN = process.env.ANYTYPE_MCP_BIN || '';
const EVALHEART = process.env.TESTHEART_BIN || '';
const HEART = process.env.HEART_BIN || '';
const enabled = [ BIN, EVALHEART, HEART ].every(p => !!p && fs.existsSync(p)) && (process.platform != 'win32');

const GRANT = { spaceIds: [] as string[], allSpaces: true, perm: 1 };

let dir = '';
let home = '';
let env: Env = null;
let svc: AiConnectService = null;
let heart: ChildProcessWithoutNullStreams = null;
let api = { port: 0, key: '', account: '', hash: '' };
/** What main reads as the renderer's shared Local API settings (the endpoint file follows it) */
const shared = { localApi: { enabled: true, port: 0 } as any, bind: { addr: '', success: true } as any };
const listen = (port: number, enabled = true) => {
	shared.localApi = { enabled, port };
	shared.bind = { addr: `127.0.0.1:${port}`, success: true };
};
/** Every child the service started: binary and verb, never its environment */
const runs: string[] = [];
/** One command to the throwaway heart, its one-line answer */
const ask = async (line: string): Promise<any> => {
	heart.stdin.write(`${line}\n`);
	return JSON.parse(await nextHeartLine());
};
/** The heart helper's stdout, line by line */
const heartLines: string[] = [];
const nextHeartLine = async (): Promise<string> => {
	for (let i = 0; (i < 1200) && !heartLines.length; i++) {
		await new Promise(r => setTimeout(r, 100));
	};
	if (!heartLines.length) {
		throw new Error('the throwaway heart did not answer');
	};
	return heartLines.shift();
};
/** A direct request with a key: only ever to the throwaway heart's own port */
const statusWith = async (key: string): Promise<number> => (await fetch(`http://127.0.0.1:${api.port}/v1/spaces`, { headers: { Authorization: `Bearer ${key}`, 'Anytype-Version': '2025-11-08' } })).status;

const freePort = (): Promise<number> => new Promise(resolve => {
	const s = net.createServer();

	s.listen(0, '127.0.0.1', () => {
		const port = (s.address() as net.AddressInfo).port;
		s.close(() => resolve(port));
	});
});

/** A minimal MCP client over the child's pipes: newline-delimited JSON-RPC; `vars` as the AI app passes the entry's `env` */
const serve = (command: string, args: string[], vars: Record<string, string> = {}) => {
	const child = spawn(command, args, { cwd: home, env: { HOME: home, USERPROFILE: home, TMPDIR: path.join(dir, 'tmp'), PATH: process.env.PATH, ...vars }, stdio: [ 'pipe', 'pipe', 'pipe' ] });
	const waiting = new Map<number, (v: any) => void>();
	let buf = '';
	let stderr = '';
	let id = 0;

	child.stdout.on('data', d => {
		buf += d;
		for (let at = buf.indexOf('\n'); at >= 0; at = buf.indexOf('\n')) {
			const text = buf.slice(0, at);

			buf = buf.slice(at + 1);
			if (text.trim()) {
				const msg = JSON.parse(text);

				waiting.get(msg.id)?.(msg);
				waiting.delete(msg.id);
			};
		};
	});
	child.stderr.on('data', d => stderr += d);

	return {
		argv: [ command, ...args ],
		stderr: () => stderr,
		request: (method: string, params?: any): Promise<any> => new Promise((resolve, reject) => {
			const n = ++id;
			const timer = setTimeout(() => reject(new Error(`${method}: no reply; stderr: ${stderr}`)), 30000);

			waiting.set(n, v => {
				clearTimeout(timer);
				resolve(v);
			});
			child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: n, method, ...(params ? { params } : {}) }) + '\n');
		}),
		notify: (method: string) => child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method }) + '\n'),
		close: (): Promise<number> => new Promise(resolve => {
			child.once('close', code => resolve(code));
			child.stdin.end();
		}),
	};
};

/** initialize → notifications/initialized, as an AI app does */
const connected = async (command: string, args: string[], vars: Record<string, string> = {}) => {
	const client = serve(command, args, vars);
	const init = await client.request('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'anytype-ts-integration', version: '0' } });

	client.notify('notifications/initialized');
	return { client, init };
};

/** Every regular file under `root` that contains `needle` */
const filesWith = (root: string, needle: string): string[] => {
	let ret: string[] = [];

	for (const it of fs.readdirSync(root, { withFileTypes: true })) {
		const p = path.join(root, it.name);

		if (it.isDirectory()) {
			ret = ret.concat(filesWith(p, needle));
		} else
		if (it.isFile() && (fs.statSync(p).size < 1024 * 1024) && fs.readFileSync(p).includes(needle)) {
			ret.push(p);
		};
	};
	return ret;
};

describe.skipIf(!enabled)('the real anytype-mcp against a throwaway heart', () => {
	beforeAll(async () => {
		dir = tempDir('aic-int-');
		home = path.join(dir, 'home');
		fs.mkdirSync(home);
		fs.mkdirSync(path.join(dir, 'tmp'));
		fs.mkdirSync(path.join(dir, 'profile'));
		fs.mkdirSync(path.join(dir, 'app', 'dist'), { recursive: true });
		// The forwarder as a build ships it, with the metadata scripts/build-mcp.js would write for it
		fs.copyFileSync(BIN, path.join(dir, 'app', 'dist', 'anytype-mcp'));
		fs.chmodSync(path.join(dir, 'app', 'dist', 'anytype-mcp'), 0o755);

		const key = (process.platform == 'darwin') ? 'darwin' : `${process.platform}-${process.arch}`;
		const meta = JSON.stringify({ signed: false, forwarder: { rev: 6, namespace: 'dev', sha256: { [key]: crypto.createHash('sha256').update(fs.readFileSync(BIN)).digest('hex') } }, mcpb: null });
		const base = nodeEnv(home, { appRoot: path.join(dir, 'app'), vars: { PATH: process.env.PATH }, buildMeta: () => meta });

		env = { ...base, run: (file: string, args: string[], opts: RunOptions) => {
			runs.push(`${file} ${args[0]}`);
			return base.run(file, args, opts);
		} };

		const setup = { env, registryFile: path.join(dir, 'profile', 'aiConnect.json'), apiState: () => shared, liveApi: (port: number) => liveApiListening(port, shared.localApi, shared.bind) };

		svc = new AiConnectService(() => setup);
		svc.configure(setup);

		// A throwaway heart: local-only account, its own data folder, a port the kernel picked
		heart = spawn(EVALHEART, [ '-heart-binary', HEART ], { stdio: [ 'pipe', 'pipe', 'pipe' ], env: { ...process.env, HOME: home, TMPDIR: path.join(dir, 'tmp') } });

		let out = '';

		heart.stdout.on('data', d => {
			out += d;
			for (let at = out.indexOf('\n'); at >= 0; at = out.indexOf('\n')) {
				heartLines.push(out.slice(0, at));
				out = out.slice(at + 1);
			};
		});
		heart.once('exit', () => heartLines.push('{"exited":true}'));

		const line = await nextHeartLine();
		const info = JSON.parse(line);

		api = { port: Number(new URL(info.api_url).port), key: info.api_key, account: info.account_id, hash: info.app_hash };
		listen(api.port);
		expect(api.hash).toBeTruthy();
		expect(new URL(info.api_url).hostname).toBe('127.0.0.1');
		// Never the port a real Anytype listens on
		expect(api.port).not.toBe(31009);
	}, 180000);

	afterAll(async () => {
		if (heart) {
			await new Promise<void>(resolve => {
				heart.once('exit', () => resolve());
				heart.stdin.end();
				setTimeout(() => {
					heart.kill('SIGKILL');
					resolve();
				}, 20000);
			});
		};
		if (dir) {
			fs.rmSync(dir, { recursive: true, force: true });
		};
	}, 60000);

	test('D1-05 / D1-10: the endpoint the desktop writes → preflight on the stable copy → Command with the key in `env` → serve; isActive turns true; port move and API off send nothing; Disconnect → RevokeApp → 401', async () => {
		const endpoint = path.join(home, '.anytype', 'ai-connect', 'endpoint-dev.json');
		const stable = path.join(home, '.anytype', 'bin-dev', 'anytype-mcp');

		// --- the plan of Other app's Command setup: the stable copy installed, the endpoint written, the real forwarder judges it
		const planned: any = await svc.plan({ accountId: api.account, appId: 'other', route: 'stdio', tier: 'full', port: api.port, method: 'command' });

		expect(planned).toMatchObject({ ok: true, needsKey: true, setups: [ 'url', 'command' ] });
		expect(JSON.parse(fs.readFileSync(endpoint, 'utf8'))).toEqual({ v: 1, port: api.port });
		expect(modeOf(endpoint)).toBe(0o600);
		expect(runs).toContain(`${fs.realpathSync(stable)} endpoint`);
		expect(fs.readFileSync(`${stable}.rev`, 'utf8')).toBe('6\n');

		const entry = JSON.parse(planned.steps.find((it: any) => it.snippet).snippet).mcpServers.anytype;

		expect(entry).toEqual({ command: fs.realpathSync(stable), args: [ 'serve', '--tier', 'full' ], env: { ANYTYPE_API_KEY: '<KEY>' } });

		// --- a real minted key, recorded as the manual Command connection the user set up
		const minted = await ask('mint Integration Command');

		expect(minted.minted).toBeTruthy();
		expect(await ask(`active ${minted.minted}`)).toMatchObject({ present: true, active: false });

		const recorded: any = await svc.recordManual({
			accountId: api.account, appId: 'other', route: 'stdio', tier: 'full', recommendedTier: 'full', port: api.port, appHash: minted.minted,
			name: 'Integration Command', grant: GRANT, expireAt: 0, expectedHash: null, setup: 'command',
		});

		expect(recorded).toMatchObject({ ok: true, connection: { method: 'manual', setup: 'command', route: 'stdio' } });

		// --- serve, exactly as the app starts the entry: the key only in the environment
		const full = await connected(entry.command, entry.args, { ANYTYPE_API_KEY: minted.key });

		expect(full.client.argv.join(' ')).not.toContain(minted.key);
		expect(full.init.result.capabilities).toHaveProperty('tools');

		const names: string[] = (await full.client.request('tools/list')).result.tools.map((t: any) => t.name);

		expect(names).toContain('list_spaces');
		expect(names.slice(-2)).toEqual([ 'download_file', 'upload_local_file' ]);

		const call = await full.client.request('tools/call', { name: 'list_spaces', arguments: {} });

		expect(call.error).toBeUndefined();
		expect(call.result.isError).toBeFalsy();
		expect(await full.client.close()).toBe(0);
		// One authenticated request: heart's isActive for this key (what "Connected" on the extension route reads)
		expect(await ask(`active ${minted.minted}`)).toMatchObject({ present: true, active: true });

		// --- the API "moved": the next check rewrites the endpoint, and the forwarder sends nothing to the old port
		const elsewhere = await freePort();

		expect(elsewhere).not.toBe(31009);
		listen(elsewhere);
		await svc.check({ accountId: api.account, apiListening: true, port: elsewhere, keys: null });
		expect(JSON.parse(fs.readFileSync(endpoint, 'utf8'))).toEqual({ v: 1, port: elsewhere });

		const away = await connected(entry.command, entry.args, { ANYTYPE_API_KEY: minted.key });

		expect(away.init.error?.code).toBe(-32001);
		await away.client.close();

		// --- the API switched off: the endpoint file goes; Anytype "can't be reached"
		listen(api.port, false);
		await svc.check({ accountId: api.account, apiListening: false, keys: null });
		expect(fs.existsSync(endpoint)).toBe(false);

		const off = await connected(entry.command, entry.args, { ANYTYPE_API_KEY: minted.key });

		expect(off.init.error?.code).toBe(-32001);
		await off.client.close();

		// --- back on
		listen(api.port);
		await svc.check({ accountId: api.account, apiListening: true, port: api.port, keys: null });

		const back = await connected(entry.command, entry.args, { ANYTYPE_API_KEY: minted.key });

		expect(back.init.result.capabilities).toHaveProperty('tools');
		await back.client.close();

		// --- Disconnect: the hash queued first; RevokeApp; heart rejects the key, and the forwarder says so
		expect(await statusWith(minted.key)).toBe(200);
		expect(await svc.remove({ accountId: api.account, connectionId: recorded.connection.id, expectedHash: minted.minted })).toMatchObject({ ok: true, connection: { removed: true, revokePending: [ minted.minted ] } });
		expect(await ask(`revoke ${minted.minted}`)).toEqual({ revoked: minted.minted, code: 0 });
		expect(await svc.revoked({ accountId: api.account, connectionId: recorded.connection.id, hash: minted.minted })).toEqual({ ok: true, connection: null });
		expect(await statusWith(minted.key)).toBe(401);

		const gone = await connected(entry.command, entry.args, { ANYTYPE_API_KEY: minted.key });
		const after = await gone.client.request('tools/list');

		expect(JSON.stringify([ gone.init, after ])).toMatch(/no longer accepts this key/);
		await gone.client.close();

		// The key never reached a file of Anytype's: not the home (endpoint, stable copy), not the profile
		expect(filesWith(home, minted.key)).toEqual([]);
		expect(filesWith(path.join(dir, 'profile'), minted.key)).toEqual([]);
	}, 180000);

	test('D1-05: an Anytype folder others can write — the real forwarder says `denied`, the Command plan is refused with its rule and path; the URL plan is unaffected', async () => {
		const folder = path.join(home, '.anytype', 'ai-connect');

		fs.chmodSync(folder, 0o770);
		try {
			const planned: any = await svc.plan({ accountId: api.account, appId: 'other', route: 'stdio', tier: 'full', port: api.port, method: 'command' });

			expect(planned).toMatchObject({ ok: true, canApply: false, needsKey: false, error: { category: 'storeDenied', path: fs.realpathSync(folder) } });
			expect(planned.error.rule).toBeTruthy();
			expect(await svc.plan({ accountId: api.account, appId: 'other', route: 'http', tier: 'full', port: api.port })).toMatchObject({ ok: true, needsKey: true });
		} finally {
			fs.chmodSync(folder, 0o700);
		};
	}, 60000);
});
