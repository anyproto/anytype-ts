/**
 * The REAL forwarder (heart's cmd/anytype-mcp) against a throwaway heart, driven by the real service on a
 * scratch home: connect → `key set` → `serve` (initialize, tools/list, a tool call) → port heal and tier
 * change (`key retarget`) → disconnect (`key delete`).
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
import { keyCheck } from './keyStore';
import { modeOf, nodeEnv, tempDir } from './testEnv';
import type { Env } from './types';

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

/** A minimal MCP client over the child's pipes: newline-delimited JSON-RPC */
const serve = (command: string, args: string[]) => {
	const child = spawn(command, args, { cwd: home, env: { HOME: home, USERPROFILE: home, TMPDIR: path.join(dir, 'tmp'), PATH: process.env.PATH }, stdio: [ 'pipe', 'pipe', 'pipe' ] });
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
const connected = async (command: string, args: string[]) => {
	const client = serve(command, args);
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
		const meta = JSON.stringify({ signed: false, forwarder: { rev: 5, namespace: 'dev', sha256: { [key]: crypto.createHash('sha256').update(fs.readFileSync(BIN)).digest('hex') } }, mcpb: null });

		env = nodeEnv(home, { appRoot: path.join(dir, 'app'), vars: { PATH: process.env.PATH }, buildMeta: () => meta });
		svc = new AiConnectService(() => ({ env, registryFile: path.join(dir, 'profile', 'aiConnect.json') }));
		svc.configure({ env, registryFile: path.join(dir, 'profile', 'aiConnect.json') });

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

	test('Q20: connect → key set → serve (initialize, tools/list, a tool call) → retarget → key delete → RevokeApp → heart rejects the key', async () => {
		// --- connect: Other app's Command setup, through the service as the renderer's aiConnectApply does
		const applied: any = await svc.apply({
			accountId: api.account, appId: 'other', route: 'stdio', method: 'command', tier: 'full', recommendedTier: 'full', port: api.port, key: api.key,
			appHash: api.hash, name: 'Integration', grant: GRANT, expireAt: 0, expectedHash: null,
		});

		expect(applied).toMatchObject({ ok: true, connection: { appId: 'other', method: 'command', route: 'stdio', itemRev: 1 } });

		const id: string = applied.connection.id;
		const entry = JSON.parse(applied.steps.find((s: any) => s.snippet).snippet).mcpServers.anytype;
		const stable = path.join(home, '.anytype', 'bin-dev', 'anytype-mcp');
		const item = path.join(home, '.anytype', 'ai-connect', 'items-dev', `${id}.item`);

		// The command Anytype hands out: the stable copy, the connection's id, no key
		expect(entry).toEqual({ command: fs.realpathSync(stable), args: [ 'serve', '--connection', id ] });
		expect(JSON.stringify(applied)).not.toContain(api.key);
		expect(fs.readFileSync(stable)).toEqual(fs.readFileSync(BIN));
		expect(modeOf(stable)).toBe(0o755);
		expect(fs.readFileSync(`${stable}.rev`, 'utf8')).toBe('5\n');

		// --- key set: one private file per connection, written by the forwarder itself
		expect(modeOf(item)).toBe(0o600);
		expect(modeOf(path.dirname(item))).toBe(0o700);
		expect(await keyCheck(env, id)).toMatchObject({ present: true, rev: 1, account: api.account, port: api.port, tier: 'full' });
		// The key is in no file under the home or the profile except its own item
		expect(filesWith(home, api.key)).toEqual([ item ]);
		expect(filesWith(path.join(dir, 'profile'), api.key)).toEqual([]);

		// --- serve: exactly the command from the setup text, as an AI app would start it
		const full = await connected(entry.command, entry.args);

		expect(full.client.argv.join(' ')).not.toContain(api.key);
		expect(full.init.result.capabilities).toHaveProperty('tools');

		const listed = await full.client.request('tools/list');
		const names: string[] = listed.result.tools.map((t: any) => t.name);

		expect(names).toContain('list_spaces');
		// The full tier adds the two local file tools; no --files-dir was passed, so they use a fresh temp folder of this process
		expect(names.slice(-2)).toEqual([ 'download_file', 'upload_local_file' ]);
		expect(full.client.stderr()).toMatch(new RegExp(`file tools: folder ${fs.realpathSync(path.join(dir, 'tmp')).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/anytype-mcp-files-`));

		const call = await full.client.request('tools/call', { name: 'list_spaces', arguments: {} });

		expect(call.error).toBeUndefined();
		expect(call.result.isError).toBeFalsy();
		expect(JSON.stringify(call.result)).toMatch(/"data"|spaces|has_more/);
		expect(await full.client.close()).toBe(0);

		// --- port heal: heart "moved" to another port → check retargets the item; the same key, nothing revoked
		const elsewhere = await freePort();

		expect(elsewhere).not.toBe(31009);
		expect(await svc.check({ accountId: api.account, apiListening: true, port: elsewhere, keys: [ { hash: api.hash, present: true } ] })).toMatchObject({
			healed: [ id ], connections: [ { status: 'ok', port: elsewhere, itemRev: 2, revokePending: [] } ],
		});
		expect(await keyCheck(env, id)).toMatchObject({ present: true, rev: 2, port: elsewhere });

		// Nothing listens there: the forwarder answers every request itself, and never sends the key anywhere else
		const away = await connected(entry.command, entry.args);
		const refused = await away.client.request('tools/list');

		// -32001 on initialize (Anytype is not running), then -32002 for a request before a successful initialize
		expect(away.init.error?.code).toBe(-32001);
		expect(away.init.result).toBeUndefined();
		expect(refused.error?.code).toBe(-32002);
		await away.client.close();

		// …and back, with a tier change on top (an in-place update: `key retarget`)
		await svc.check({ accountId: api.account, apiListening: true, port: api.port, keys: [ { hash: api.hash, present: true } ] });
		expect(await svc.update({ accountId: api.account, connectionId: id, expectedHash: api.hash, port: api.port, tier: 'large' })).toMatchObject({ ok: true, connection: { tier: 'large', itemRev: 4 } });
		expect(await keyCheck(env, id)).toMatchObject({ present: true, rev: 4, port: api.port, tier: 'large' });
		expect(filesWith(home, api.key)).toEqual([ item ]);

		const large = await connected(entry.command, entry.args);
		const largeNames: string[] = (await large.client.request('tools/list')).result.tools.map((t: any) => t.name);

		// A curated tier lists and serves nothing local; heart still accepts the retargeted key
		expect(largeNames).not.toContain('upload_local_file');
		expect(largeNames).toContain('spaces');
		expect(largeNames).not.toContain('list_spaces');

		const largeCall = await large.client.request('tools/call', { name: 'spaces', arguments: {} });

		expect(largeCall.error).toBeUndefined();
		expect(largeCall.result.isError).toBeFalsy();
		await large.client.close();

		// --- disconnect: the revocation is queued, the item deleted
		// heart accepts the key right up to the disconnect
		expect(await statusWith(api.key)).toBe(200);
		expect(await svc.remove({ accountId: api.account, connectionId: id, expectedHash: api.hash })).toMatchObject({ ok: true, connection: { removed: true, revokePending: [ api.hash ] } });

		// Q20: the renderer's step — RevokeApp under the account's session, then aiConnectRevoked — and heart rejects the key
		heart.stdin.write(`revoke ${api.hash}\n`);
		expect(JSON.parse(await nextHeartLine())).toEqual({ revoked: api.hash, code: 0 });
		expect(await svc.revoked({ accountId: api.account, connectionId: id, hash: api.hash })).toEqual({ ok: true, connection: null });
		expect(await statusWith(api.key)).toBe(401);
		expect(JSON.parse(fs.readFileSync(path.join(dir, 'profile', 'aiConnect.json'), 'utf8')).connections).toEqual([]);
		expect(fs.existsSync(item)).toBe(false);
		expect(await keyCheck(env, id)).toEqual({ present: false });
		expect(filesWith(home, api.key)).toEqual([]);

		// The command is still in the user's app: a `serve` without an item stays not connected
		const gone = await connected(entry.command, entry.args);
		const after = await gone.client.request('tools/list');

		expect(gone.init.error?.code).toBe(-32001);
		expect(after.result).toBeUndefined();
		await gone.client.close();

		// No key ever reached the registry
		expect(fs.readFileSync(path.join(dir, 'profile', 'aiConnect.json'), 'utf8')).not.toContain(api.key);
	}, 180000);
});
