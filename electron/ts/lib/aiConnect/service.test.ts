/**
 * The service's bookkeeping (plan §3.11) on a fake Mac: queue, staleness, the revocation set,
 * reconciliation, manual records; plus the main-process sentinel-key sweep and a source scan.
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, test, vi } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: () => '/nonexistent', getVersion: () => '0.0.0', getFileIcon: vi.fn(), getApplicationInfoForProtocol: vi.fn() }, shell: { openExternal: vi.fn(), showItemInFolder: vi.fn() } }));
vi.mock('electron-util', () => ({ fixPathForAsarUnpack: (p: string) => p }));

import { AiConnectService } from './index';
import { FORWARDER_BIN, FORWARDER_FILES, GRANT, KEY_A, KEY_B, KEY_C, MCP_DIR, REGISTRY, applyParam, keysOf, mac, planParam, service } from './testKit';
import { keyFingerprint } from './digest';
import type { FakeEnv } from './testEnv';
import type { AiRecord } from './types';

const CURSOR = '/Users/me/.cursor/mcp.json';

const records = (env: FakeEnv): AiRecord[] => JSON.parse(env.readText(REGISTRY) || '{"connections":[]}').connections;
const recordOf = (env: FakeEnv, id = 'cursor', accountId = 'acc-a'): AiRecord => records(env).find(r => (r.id == id) && (r.accountId == accountId));
const statusOf = (res: any, id = 'cursor') => res.connections.find((c: any) => c.id == id)?.status;

afterEach(() => {
	vi.restoreAllMocks();
});

describe('service: queue and staleness', () => {
	test('concurrent applies are serialised: the second one is stale (the first created the record)', async () => {
		const env = mac({ apps: [ 'Cursor' ] });
		const svc = service(env);
		const [ a, b ] = await Promise.all([ svc.apply(applyParam()), svc.apply(applyParam({ key: KEY_B, appHash: 'hash-a2' })) ]);

		expect(a).toMatchObject({ ok: true });
		expect(b).toEqual({ ok: false, error: { stage: 'validate', category: 'stale' } });
		expect(JSON.parse(env.files()[CURSOR]).mcpServers.anytype.headers.Authorization).toBe(`Bearer ${KEY_A}`);
	});

	test('an expectedHash mismatch → stale, nothing written; apply / recordManual on a removed record → stale', async () => {
		const env = mac({ apps: [ 'Cursor' ] });
		const svc = service(env);

		await svc.apply(applyParam());

		const bytes = env.files()[CURSOR];

		expect(await svc.apply(applyParam({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'other' }))).toEqual({ ok: false, error: { stage: 'validate', category: 'stale' } });
		expect(await svc.update({ accountId: 'acc-a', connectionId: 'cursor', expectedHash: 'other', port: 31010 })).toEqual({ ok: false, error: { stage: 'validate', category: 'stale' } });
		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'cursor', expectedHash: 'other' })).toEqual({ ok: false, error: { stage: 'validate', category: 'stale' } });
		expect(env.files()[CURSOR]).toBe(bytes);

		await svc.remove({ accountId: 'acc-a', connectionId: 'cursor', expectedHash: 'hash-a1' });
		expect(await svc.apply(applyParam({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }))).toEqual({ ok: false, error: { stage: 'validate', category: 'stale' } });
		const { key: _key, ...manual } = applyParam({ appHash: 'hash-a3', expectedHash: 'hash-a1' });

		expect(await svc.recordManual({ ...manual, connectionId: 'cursor' })).toEqual({ ok: false, error: { stage: 'validate', category: 'stale' } });
	});
});

describe('service: the revocation set', () => {
	test('a rotation adds the previous hash; the same hash adds nothing; remove adds the current one; deleted only when nothing is pending', async () => {
		const env = mac({ apps: [ 'Cursor' ] });
		const svc = service(env);

		await svc.apply(applyParam());
		await svc.apply(applyParam({ expectedHash: 'hash-a1' }));
		expect(recordOf(env).revokePending).toEqual([]);

		await svc.apply(applyParam({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }));
		expect(recordOf(env)).toMatchObject({ appHash: 'hash-a2', keyFp: keyFingerprint(KEY_B), revokePending: [ 'hash-a1' ] });

		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'cursor', expectedHash: 'hash-a2' })).toMatchObject({ ok: true, connection: { removed: true, revokePending: [ 'hash-a1', 'hash-a2' ], status: 'removed' } });
		expect(await svc.revoked({ accountId: 'acc-a', connectionId: 'cursor', hash: 'hash-a2' })).toMatchObject({ ok: true, connection: { revokePending: [ 'hash-a1' ] } });
		expect(statusOf(await svc.check({ accountId: 'acc-a', apiListening: false, keys: null }))).toBe('revokeFailed');
		expect(await svc.revoked({ accountId: 'acc-a', connectionId: 'cursor', hash: 'hash-a1' })).toEqual({ ok: true, connection: null });
		expect(records(env)).toEqual([]);
	});

	test('a key list never clears a pending revocation or an orphan: only a RevokeApp answer does (aiConnectRevoked / aiConnectOrphan done)', async () => {
		const env = mac({ apps: [ 'Cursor' ] });
		const svc = service(env);

		await svc.apply(applyParam());
		await svc.apply(applyParam({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }));
		await svc.orphan({ accountId: 'acc-a', hash: 'orphan-1' });

		await svc.check({ accountId: 'acc-a', apiListening: false, keys: null });
		expect(recordOf(env).revokePending).toEqual([ 'hash-a1' ]);

		// heart skips grant files it can't read, so a list that lacks the hash proves nothing (§2.9)
		await svc.check({ accountId: 'acc-a', apiListening: false, keys: [ ...keysOf([ 'hash-a2', 'unmanaged' ], [ 'hash-a1', 'orphan-1', 'unmanaged-2' ]) ] });
		expect(recordOf(env).revokePending).toEqual([ 'hash-a1' ]);
		expect((await svc.list({ accountId: 'acc-a' }) as any).orphanHashes).toEqual([ 'orphan-1' ]);

		// RevokeApp said success or "not found": the renderer reports it, and only then they go
		await svc.revoked({ accountId: 'acc-a', connectionId: 'cursor', hash: 'hash-a1' });
		await svc.orphan({ accountId: 'acc-a', hash: 'orphan-1', done: true });
		expect(recordOf(env).revokePending).toEqual([]);
		expect((await svc.list({ accountId: 'acc-a' }) as any).orphanHashes).toEqual([]);
	});

	test('a removed record is deleted once every revoke was confirmed, never because a key list lacks its hashes', async () => {
		const env = mac({ apps: [ 'Cursor' ] });
		const svc = service(env);

		await svc.apply(applyParam());
		await svc.apply(applyParam({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }));
		await svc.remove({ accountId: 'acc-a', connectionId: 'cursor', expectedHash: 'hash-a2' });
		await svc.check({ accountId: 'acc-a', apiListening: false, keys: keysOf([], [ 'hash-a1', 'hash-a2' ]) });
		expect(recordOf(env).revokePending).toEqual([ 'hash-a1', 'hash-a2' ]);
		expect(await svc.revoked({ accountId: 'acc-a', connectionId: 'cursor', hash: 'hash-a1' })).toMatchObject({ ok: true, connection: { revokePending: [ 'hash-a2' ] } });
		expect(await svc.revoked({ accountId: 'acc-a', connectionId: 'cursor', hash: 'hash-a2' })).toEqual({ ok: true, connection: null });
		expect(records(env)).toEqual([]);
	});

	test('accessEnded for a key heart no longer has; grant and expiry refreshed from present keys', async () => {
		const env = mac({ apps: [ 'Cursor' ] });
		const svc = service(env);

		await svc.apply(applyParam());

		const grant = { spaceIds: [ 'space-1' ], allSpaces: false, perm: 0 };

		await svc.check({ accountId: 'acc-a', apiListening: true, port: 31009, keys: [ { hash: 'hash-a1', present: true, grant, expireAt: 99 } ] });
		expect(recordOf(env)).toMatchObject({ grant, expireAt: 99 });
		expect(statusOf(await svc.check({ accountId: 'acc-a', apiListening: true, port: 31009, keys: keysOf([], [ 'hash-a1' ]) }))).toBe('accessEnded');
	});

	test('without a listening API nothing is healed, statuses not derived from keys keep their last value', async () => {
		const env = mac({ apps: [ 'Cursor' ] });
		const svc = service(env);

		await svc.apply(applyParam());
		env.unlink(CURSOR);

		expect(statusOf(await svc.check({ accountId: 'acc-a', apiListening: true, port: 31009, keys: null }))).toBe('removed');
		env.writeFile(CURSOR, JSON.stringify({ mcpServers: { anytype: { url: 'http://127.0.0.1:1/mcp/large', headers: { Authorization: `Bearer ${KEY_A}` } } } }), 0o600).close();
		expect(statusOf(await svc.check({ accountId: 'acc-a', apiListening: false, keys: null }))).toBe('removed');
		expect(JSON.parse(env.files()[CURSOR]).mcpServers.anytype.url).toBe('http://127.0.0.1:1/mcp/large');
	});

	test('notInstalled when no card mapping to the target is installed', async () => {
		const env = mac({ apps: [ 'Cursor' ] });
		const svc = service(env);

		await svc.apply(applyParam());

		const gone = mac({ files: { [REGISTRY]: env.files()[REGISTRY], [CURSOR]: env.files()[CURSOR] } });

		expect(statusOf(await service(gone).check({ accountId: 'acc-a', apiListening: true, port: 31009, keys: null }))).toBe('notInstalled');
	});
});

describe('service: manual records', () => {
	test('Other app: a random id not derived from the key; reconnect keeps it; never notInstalled, never an adapter', async () => {
		const env = mac();
		const svc = service(env);
		const manual = (over: Record<string, any> = {}) => ({ accountId: 'acc-a', appId: 'other', route: 'http', tier: 'large', recommendedTier: 'large', port: 31009, appHash: 'hash-m1', name: 'My tool', grant: GRANT, expireAt: 0, expectedHash: null, ...over });
		const first: any = await svc.recordManual(manual());

		expect(first).toMatchObject({ ok: true, connection: { method: 'manual', keyFp: '', targetPath: '', status: 'ok' } });
		expect(first.connection.id).toMatch(/^other-[0-9a-f]{8}$/);

		const again: any = await svc.recordManual(manual({ appHash: 'hash-m2', expectedHash: 'hash-m1', connectionId: first.connection.id }));

		expect(again.connection).toMatchObject({ id: first.connection.id, appHash: 'hash-m2', revokePending: [ 'hash-m1' ] });

		const runs = env.calls.length;

		expect(statusOf(await svc.check({ accountId: 'acc-a', apiListening: true, port: 31010, keys: null }), first.connection.id)).toBe('ok');
		expect(statusOf(await svc.check({ accountId: 'acc-a', apiListening: true, port: 31010, keys: keysOf([], [ 'hash-m2' ]) }), first.connection.id)).toBe('accessEnded');
		expect(env.calls.length).toBe(runs);
		expect(await svc.update({ accountId: 'acc-a', connectionId: first.connection.id, expectedHash: 'hash-m2', port: 31010 })).toEqual({ ok: false, error: { stage: 'validate', category: 'unsupportedForm' } });
	});

	test('a Release 1 card set up by hand: same target id, not notInstalled even when the app is gone', async () => {
		const env = mac();
		const svc = service(env);

		expect(await svc.recordManual({ accountId: 'acc-a', appId: 'cursor', route: 'http', tier: 'large', recommendedTier: 'large', port: 31009, appHash: 'hash-m1', name: 'Cursor', grant: GRANT, expireAt: 0, expectedHash: null })).toMatchObject({ ok: true, connection: { id: 'cursor', method: 'manual' } });
		expect(statusOf(await svc.check({ accountId: 'acc-a', apiListening: true, port: 31009, keys: null }))).toBe('ok');
		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'cursor', expectedHash: 'hash-m1' })).toMatchObject({ ok: true, connection: { removed: true } });
	});
});

describe('service: accounts, persistence, other methods', () => {
	test('other accounts are invisible; nextStep, lastProbe and recommendedTier persist', async () => {
		const env = mac({ apps: [ 'Cursor' ] });
		const svc = service(env);

		await svc.apply(applyParam({ recommendedTier: 'small' }));
		expect((await svc.list({ accountId: 'acc-b' }) as any).connections).toEqual([]);
		expect((await svc.check({ accountId: 'acc-b', apiListening: true, port: 31009, keys: null }) as any).connections).toEqual([]);
		expect(recordOf(env)).toMatchObject({ nextStep: 'restart', recommendedTier: 'small', lastProbe: 'none' });

		const reloaded: any = await service(env).list({ accountId: 'acc-a' });

		expect(reloaded.connections[0]).toMatchObject({ nextStep: 'restart', recommendedTier: 'small' });
		expect(await svc.stepDone({ accountId: 'acc-a', connectionId: 'cursor' })).toMatchObject({ ok: true, connection: { nextStep: 'none' } });
	});

	test('restartApp only for a card that can be restarted; reveal and openApp act on detected things only', async () => {
		const env = mac({ apps: [ 'Cursor' ] });
		const svc = service(env);
		const shown: string[] = [];

		env.showItemInFolder = p => shown.push(p);
		expect(await svc.restartApp({ appId: 'vscode' })).toEqual({ ok: false, error: { stage: 'restart', category: 'unsupportedPackage' } });

		await svc.apply(applyParam());
		expect(await svc.reveal({ accountId: 'acc-a', connectionId: 'cursor' })).toEqual({ ok: true });
		expect(await svc.reveal({ appId: 'cursor', what: 'target' })).toEqual({ ok: true });
		// Nothing there yet (no LM Studio home): nothing is shown
		expect(await svc.reveal({ appId: 'lmstudio', what: 'target' })).toEqual({ ok: false });
		expect(shown).toEqual([ CURSOR, CURSOR ]);
		expect(await svc.openApp({ appId: 'vscode' })).toEqual({ ok: false });
	});
});

describe('sentinel key (main)', () => {
	test('D1-01: a sentinel key through every flow (bundle, Claude config, Other URL, Other Command, Cursor), after the candidate save, a failed write, promotion, reload, an HTTP port heal and Disconnect: in no registry write, IPC result or log; keycheck passes on userData and ~/.anytype; only live config files hold it', async () => {
		const logged: string[] = [];

		for (const m of [ 'log', 'info', 'warn', 'error', 'debug' ] as const) {
			vi.spyOn(console, m).mockImplementation((...args: any[]) => {
				logged.push(JSON.stringify(args));
			});
		};

		const claude = '/Users/me/.local/bin/claude';
		const DESKTOP = '/Users/me/Library/Application Support/Claude/claude_desktop_config.json';
		let env: FakeEnv = null;

		env = mac({
			apps: [ 'Cursor', 'Claude', 'ChatGPT', 'Visual Studio Code', 'LM Studio' ],
			dirs: [ '/Users/me/.codex', '/Users/me/.lmstudio', '/Users/me/.claude', '/Users/me/Library/Application Support/Claude' ],
			files: {
				[claude]: '',
				[`${MCP_DIR}/Anytype.mcpb`]: 'zip',
				[DESKTOP]: '{}',
				'/Users/me/.cursor/mcp.json': '{"mcpServers":{}}',
				...FORWARDER_FILES,
				[`${MCP_DIR}/skill/SKILL.md`]: '---\nname: anytype-api\n---\nbody\n',
				[`${MCP_DIR}/skill/PREAMBLE.md`]: '<!-- anytype-desktop:begin -->\nx\n<!-- anytype-desktop:end -->\n',
			},
			shell: { claude },
			run: call => {
				if (call.file != claude) {
					return null;
				};
				if (call.args[0] == '--version') {
					return { code: 0, stdout: '2.1.332\n' };
				};
				if (call.args[1] == 'add-json') {
					if (env.exists('/Users/me/.claude.json')) {
						env.unlink('/Users/me/.claude.json');
					};
					env.writeFile('/Users/me/.claude.json', JSON.stringify({ mcpServers: { anytype: JSON.parse(call.opts.stdin) } }), 0o600).close();
				};
				if (call.args[1] == 'remove') {
					env.unlink('/Users/me/.claude.json');
					env.writeFile('/Users/me/.claude.json', '{}', 0o600).close();
				};
				return { code: 0, stdout: '' };
			},
		});

		// Every write as it happens (temps, backups, the registry), every external open, every service log line, every IPC result
		const writes: { p: string; data: string }[] = [];
		const write = env.writeFile;
		const opened: string[] = [];
		const svcLog: string[] = [];
		const results: any[] = [];

		env.writeFile = (p, data, mode) => {
			writes.push({ p, data: String(data) });
			return write(p, data, mode);
		};
		env.protocolHandler = async () => ({ name: 'LM Studio', path: '/Applications/LM Studio.app' });
		env.openExternal = async url => {
			opened.push(url);
			return true;
		};

		const api = { localApi: { enabled: true, port: 31009 }, bind: { addr: '127.0.0.1:31009', success: true } };
		const setup = { env, registryFile: REGISTRY, apiState: () => api, log: (method: string, code: string) => svcLog.push(`${method} ${code}`) };
		let svc = new AiConnectService(() => setup);
		const call = async (res: Promise<any>) => {
			const v = await res;

			results.push(v);
			return v;
		};

		svc.configure(setup);

		const cards: [ string, string, string, Record<string, any> ][] = [
			[ 'cursor', 'http', 'config', {} ], [ 'vscode', 'http', 'config', {} ], [ 'chatgpt', 'http', 'config', {} ], [ 'lmstudio', 'http', 'deeplink', {} ],
			[ 'claude-desktop', 'stdio', 'package', { method: 'package', tier: 'full', recommendedTier: 'full' } ], [ 'claude-code', 'skill', 'config', {} ],
		];

		for (const [ appId, route, method, over ] of cards) {
			let res: any = await call(svc.apply(applyParam({ appId, route, key: KEY_C, appHash: `hash-${appId}`, ...over })));

			expect(res, appId).toMatchObject({ ok: true, connection: { method } });

			// LM Studio: the deeplink delivered it; the file fallback with the same key makes the update possible
			if (appId == 'lmstudio') {
				res = await call(svc.apply(applyParam({ appId, route, key: KEY_C, appHash: `hash-${appId}`, expectedHash: `hash-${appId}`, method: 'config' })));
				expect(res).toMatchObject({ ok: true, connection: { method: 'config' } });
			};

			expect(await call(svc.update({ accountId: 'acc-a', connectionId: res.connection.id, expectedHash: `hash-${appId}`, port: 31010 })), appId).toMatchObject({ ok: true });
		};

		expect(opened).toHaveLength(1);
		expect(opened[0]).toMatch(/^lmstudio:\/\/add_mcp\?/);

		// The bundle key went to the clipboard through the one guarded copy; Copy key again the same way
		expect(env.clip.text).toBe(KEY_C);
		expect(await call(svc.copySecret({ accountId: 'acc-a', connectionId: 'claude-desktop', text: KEY_C }))).toEqual({ ok: true });

		// Other URL and Other Command: manual records, the key never reaches main except as clipboard text
		await call(svc.recordManual({ accountId: 'acc-a', appId: 'other', route: 'http', tier: 'large', recommendedTier: 'large', port: 31009, appHash: 'hash-other-url', name: 'Other', grant: GRANT, expireAt: 0, expectedHash: null }));
		await call(svc.recordManual({ accountId: 'acc-a', appId: 'other', route: 'stdio', tier: 'full', recommendedTier: 'full', port: 31009, appHash: 'hash-other-cmd', name: 'Other', grant: GRANT, expireAt: 0, expectedHash: null, setup: 'command' }));
		await call(svc.copySecret({ accountId: 'acc-a', appHash: 'hash-other-cmd', text: `{"env":{"ANYTYPE_API_KEY":"${KEY_C}"}}` }));

		// A failed write: Cursor's rename refused once — the reconnect fails, its temp is gone
		const rename = env.rename;
		let refuse = true;

		env.rename = (from, to) => {
			if (refuse && (to == '/Users/me/.cursor/mcp.json')) {
				refuse = false;
				throw Object.assign(new Error('denied'), { code: 'EACCES' });
			};
			rename(from, to);
		};
		expect(await call(svc.apply(applyParam({ appId: 'cursor', route: 'http', key: KEY_A, appHash: 'hash-cursor-2', expectedHash: 'hash-cursor' })))).toMatchObject({ ok: false });

		// Claude's config route: the candidate is saved, the entry written, then the record's own save fails (Anytype "dies")
		let candidateWritten = false;
		let failRegistry = false;

		env.rename = (from, to) => {
			if (failRegistry && (to == REGISTRY)) {
				throw Object.assign(new Error('disk full'), { code: 'ENOSPC' });
			};
			rename(from, to);
			// Once the candidate is on disk, every later registry save fails
			failRegistry = failRegistry || ((to == REGISTRY) && candidateWritten);
		};

		const journal = env.writeFile;

		env.writeFile = (p, data, mode) => {
			candidateWritten = candidateWritten || (p.startsWith(path.dirname(REGISTRY)) && String(data).includes('"hash-cd-config"'));
			return journal(p, data, mode);
		};
		expect(await call(svc.apply(applyParam({ appId: 'claude-desktop', route: 'stdio', method: 'config', key: KEY_C, appHash: 'hash-cd-config', expectedHash: 'hash-claude-desktop', quitConfirmed: true })))).toMatchObject({ ok: true, recordSaved: false });
		env.writeFile = journal;
		env.rename = rename;

		// Reload: a new service reads the registry the crash left; its check promotes the candidate by the entry's key
		svc = new AiConnectService(() => setup);
		svc.configure(setup);
		expect(records(env).find(r => r.id == 'claude-desktop')).toMatchObject({ appHash: 'hash-claude-desktop', unconfirmed: [ { appHash: 'hash-cd-config' } ] });

		// An HTTP port heal (Cursor's entry rewritten with the key on the new port), the promotion, and a list
		const check: any = await call(svc.check({ accountId: 'acc-a', apiListening: true, port: 31011, keys: null }));

		expect(check.ok).toBe(true);
		expect(check.healed).toContain('cursor');
		expect(records(env).find(r => r.id == 'claude-desktop')).toMatchObject({ appHash: 'hash-cd-config', method: 'config', revokePending: [ 'hash-claude-desktop' ] });
		await call(svc.list({ accountId: 'acc-a' }));

		// The Claude Code MCP route: the key only on the CLI's stdin
		expect(await call(svc.remove({ accountId: 'acc-a', connectionId: 'claude-code', expectedHash: 'hash-claude-code' }))).toMatchObject({ ok: true });
		await call(svc.revoked({ accountId: 'acc-a', connectionId: 'claude-code', hash: 'hash-claude-code' }));
		expect(await call(svc.apply(applyParam({ appId: 'claude-code', route: 'http', key: KEY_C, appHash: 'hash-cc2' })))).toMatchObject({ ok: true, connection: { method: 'cli' } });
		expect(env.calls.filter(c => (c.file == claude) && (c.args[1] == 'add-json') && c.opts.stdin.includes(KEY_C))).toHaveLength(1);

		// Live config files hold the key now (and only they): Cursor, VS Code, ChatGPT, LM Studio, Claude Code, Claude's config
		const holding = () => Object.keys(env.files()).filter(f => env.files()[f].includes(KEY_C)).sort();

		expect(holding().every(f => /(mcp\.json|mcp-config\.json|config\.toml|settings\.json|\.claude\.json|claude_desktop_config\.json)$/.test(f)), JSON.stringify(holding())).toBe(true);

		// Disconnect
		for (const rec of records(env)) {
			expect(await call(svc.remove({ accountId: 'acc-a', connectionId: rec.id, expectedHash: rec.appHash || null })), rec.id).toMatchObject({ ok: true });
		};

		// Anytype's own files never held it: no registry write (not even a transient one), nothing in ~/.anytype
		expect(writes.filter(w => w.p.startsWith(path.dirname(REGISTRY))).every(w => !w.data.includes(KEY_C))).toBe(true);
		expect(writes.filter(w => w.p.startsWith('/Users/me/.anytype/')).every(w => !w.data.includes(KEY_C))).toBe(true);
		// No backup and no temp of a file Anytype wrote a key into is left, anywhere
		expect(Object.keys(env.files()).filter(f => f.endsWith('.anytype-backup') || f.endsWith('.tmp'))).toEqual([]);
		expect(JSON.stringify(results)).not.toContain(KEY_C);
		expect(JSON.stringify(results)).not.toContain(KEY_A);
		expect(logged.join('\n')).not.toContain(KEY_C);
		expect(svcLog.join('\n')).not.toContain(KEY_C);
		// No child got the key in argv or in its environment; only the Claude CLI got it, on stdin
		expect(env.calls.filter(c => c.args.join(' ').includes(KEY_C))).toEqual([]);
		expect(env.calls.filter(c => JSON.stringify(c.opts.env || {}).includes(KEY_C))).toEqual([]);
		expect(env.calls.filter(c => (c.opts.stdin || '').includes(KEY_C)).every(c => c.file == claude)).toBe(true);

		// scripts/ai-connect-keycheck.js on the fake userData and ~/.anytype, written out to real folders
		const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'aic-d1-')));

		try {
			for (const [ f, text ] of Object.entries(env.files())) {
				if (f.startsWith(path.dirname(REGISTRY)) || f.startsWith('/Users/me/.anytype/')) {
					fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true });
					fs.writeFileSync(path.join(root, f), text);
				};
			};
			for (const dir of [ path.dirname(REGISTRY), '/Users/me/.anytype' ]) {
				fs.mkdirSync(path.join(root, dir), { recursive: true });

				const res = spawnSync(process.execPath, [ path.join(__dirname, '../../../../scripts/ai-connect-keycheck.js'), path.join(root, dir) ], { input: KEY_C, encoding: 'utf8' });

				expect(res.status, dir).toBe(0);
				expect(res.stdout).toMatch(/^PASS/);
			};
		} finally {
			fs.rmSync(root, { recursive: true, force: true });
		};
	});
});

describe('service: phase 2 review round 1', () => {
	test('T2: the target took the new key but the registry save failed: committed (`recordSaved: false`), listed, saved by the next call', async () => {
		const env = mac({ apps: [ 'Cursor' ] });
		const svc = service(env);
		const rename = env.rename;
		let failing = false;

		await svc.apply(applyParam());
		env.rename = (from, to) => {
			if (failing && (to == REGISTRY)) {
				throw Object.assign(new Error('EACCES'), { code: 'EACCES' });
			};
			rename(from, to);
		};
		failing = true;

		const res: any = await svc.apply(applyParam({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }));

		expect(res).toMatchObject({ ok: true, recordSaved: false, connection: { appHash: 'hash-a2', revokePending: [ 'hash-a1' ] } });
		expect(JSON.parse(env.files()[CURSOR]).mcpServers.anytype.headers.Authorization).toBe(`Bearer ${KEY_B}`);
		expect(recordOf(env).appHash).toBe('hash-a1');
		expect(((await svc.list({ accountId: 'acc-a' })) as any).connections[0]).toMatchObject({ appHash: 'hash-a2' });

		failing = false;
		await svc.check({ accountId: 'acc-a', apiListening: false, keys: null });
		expect(recordOf(env)).toMatchObject({ appHash: 'hash-a2', keyFp: keyFingerprint(KEY_B), revokePending: [ 'hash-a1' ] });
	});

	test('T2: "I\'ve updated" (recordManual) whose save fails still stands', async () => {
		const env = mac();
		const svc = service(env);

		env.rename = () => {
			throw Object.assign(new Error('EACCES'), { code: 'EACCES' });
		};
		expect(await svc.recordManual({ accountId: 'acc-a', appId: 'other', route: 'http', tier: 'large', recommendedTier: 'large', port: 31009, appHash: 'hash-m1', name: 'Tool', grant: GRANT, expireAt: 0, expectedHash: null })).toMatchObject({ ok: true, recordSaved: false, connection: { appHash: 'hash-m1' } });
	});

	test('T14: a failed lookup keeps accessEnded (manual and automatic), and nothing is healed with that key', async () => {
		const env = mac({ apps: [ 'Cursor' ] });
		const svc = service(env);

		await svc.apply(applyParam());
		await svc.recordManual({ accountId: 'acc-a', appId: 'other', route: 'http', tier: 'large', recommendedTier: 'large', port: 31009, appHash: 'hash-m1', name: 'Tool', grant: GRANT, expireAt: 0, expectedHash: null });

		const ended: any = await svc.check({ accountId: 'acc-a', apiListening: true, port: 31009, keys: keysOf([], [ 'hash-a1', 'hash-m1' ]) });

		expect(ended.connections.map((c: any) => c.status)).toEqual([ 'accessEnded', 'accessEnded' ]);

		const bytes = env.files()[CURSOR];
		const again: any = await svc.check({ accountId: 'acc-a', apiListening: true, port: 31010, keys: null });

		expect(again.connections.map((c: any) => c.status)).toEqual([ 'accessEnded', 'accessEnded' ]);
		expect(again.healed).toEqual([]);
		expect(env.files()[CURSOR]).toBe(bytes);
	});

	test('T14: an incomplete app scan never says notInstalled: the target itself is checked', async () => {
		const first = mac({ apps: [ 'Cursor' ] });

		await service(first).apply(applyParam());

		// Cursor.app now only findable through Spotlight, and Spotlight fails; ~/.cursor was created by Anytype (no evidence)
		const later = mac({ files: { [REGISTRY]: first.files()[REGISTRY], [CURSOR]: first.files()[CURSOR] }, run: call => (call.file == '/usr/bin/mdfind') ? { code: 1, stdout: '' } : null });
		const svc = service(later);

		expect(await svc.list({ accountId: 'acc-a' })).toMatchObject({ ok: true, scanOk: false });
		expect(statusOf(await svc.check({ accountId: 'acc-a', apiListening: true, port: 31009, keys: null }))).toBe('ok');
	});

	test('T23: Reveal shows only local paths inside home: a stored UNC path or a path outside home is never touched', async () => {
		const env = mac({ apps: [ 'Cursor' ] });
		const svc = service(env);
		const shown: string[] = [];
		const touched: string[] = [];

		await svc.apply(applyParam());

		for (const fn of [ 'exists', 'lstat', 'realpath', 'stat' ] as const) {
			const orig: any = env[fn];

			(env as any)[fn] = (p: string) => {
				touched.push(p);
				return orig(p);
			};
		};
		env.showItemInFolder = p => shown.push(p);

		for (const targetPath of [ '//server/share/mcp.json', '/etc/passwd' ]) {
			const doc = JSON.parse(env.readText(REGISTRY));

			doc.connections[0].targetPath = targetPath;
			env.unlink(REGISTRY);
			env.writeFile(REGISTRY, JSON.stringify(doc), 0o600).close();
			touched.length = 0;

			expect(await service(env).reveal({ accountId: 'acc-a', connectionId: 'cursor' })).toEqual({ ok: false });
			expect(touched.filter(p => p.startsWith('//'))).toEqual([]);
		};
		expect(shown).toEqual([]);
	});
});

describe('source scan', () => {
	test('no exec(, execSync( or shell: true in the main-process sources', () => {
		const root = __dirname;
		const files: string[] = [];
		const walk = (dir: string) => {
			for (const name of fs.readdirSync(dir)) {
				const p = path.join(dir, name);

				if (fs.statSync(p).isDirectory()) {
					walk(p);
				} else
				if (p.endsWith('.ts') && !/\.test\.ts$|testEnv\.ts$|testKit\.ts$/.test(p)) {
					files.push(p);
				};
			};
		};

		walk(root);
		expect(files.length).toBeGreaterThan(10);

		for (const file of files) {
			const text = fs.readFileSync(file, 'utf8');

			// child_process's exec / execSync (a shell string) by import, by member or bare; RegExp#exec is fine
			expect(text, file).not.toMatch(/import\s*\{[^}]*\bexec(Sync)?\b[^}]*\}\s*from\s*'(node:)?child_process'/);
			expect(text, file).not.toMatch(/child_process\.exec(Sync)?\(|(^|[^.\w])exec(Sync)?\(|\bexecSync\(|shell:\s*true/m);
		};
		expect(planParam().appId).toBe('cursor');
	});
});

describe('service: phase 2 review round 2', () => {
	/** Registry renames fail while `failing.on` */
	const failingRegistry = (env: FakeEnv) => {
		const rename = env.rename;
		const failing = { on: false };

		env.rename = (from, to) => {
			if (failing.on && (to == REGISTRY)) {
				throw Object.assign(new Error('EACCES'), { code: 'EACCES' });
			};
			rename(from, to);
		};
		return failing;
	};

	test('U1: while a committed record can\'t be saved it is the only version: plan sees it, a stale second window is refused, nothing is lost', async () => {
		const env = mac({ apps: [ 'Cursor' ] });
		const svc = service(env);
		const failing = failingRegistry(env);

		await svc.apply(applyParam());
		failing.on = true;
		expect(await svc.apply(applyParam({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }))).toMatchObject({ ok: true, recordSaved: false });

		// Reads see the committed record
		expect(((await svc.list({ accountId: 'acc-a' })) as any).connections[0]).toMatchObject({ appHash: 'hash-a2' });
		expect(await svc.plan(planParam())).toMatchObject({ ok: true, existing: 'ours' });

		// Anything that would change state waits for the save (a second window with the old hash among them)
		const unsaved = { ok: false, error: { stage: 'write', category: 'unsaved' } };

		expect(await svc.apply(applyParam({ key: KEY_C, appHash: 'hash-a3', expectedHash: 'hash-a1' }))).toEqual(unsaved);
		expect(await svc.recordManual({ accountId: 'acc-a', appId: 'cursor', route: 'http', tier: 'large', recommendedTier: 'large', port: 31009, appHash: 'hash-m1', name: 'Cursor', grant: GRANT, expireAt: 0, expectedHash: 'hash-a1' })).toEqual(unsaved);
		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'cursor', expectedHash: 'hash-a2' })).toEqual(unsaved);
		expect(await svc.check({ accountId: 'acc-a', apiListening: true, port: 31010, keys: null })).toEqual(unsaved);
		expect(JSON.parse(env.files()[CURSOR]).mcpServers.anytype.headers.Authorization).toBe(`Bearer ${KEY_B}`);

		// Writes recover: the committed record is saved first, then the stale request is stale
		failing.on = false;
		expect(await svc.apply(applyParam({ key: KEY_C, appHash: 'hash-a3', expectedHash: 'hash-a1' }))).toEqual({ ok: false, error: { stage: 'validate', category: 'stale' } });
		expect(recordOf(env)).toMatchObject({ appHash: 'hash-a2', revokePending: [ 'hash-a1' ] });
	});

	test('U1: two manual deliveries while saving fails: the second is refused, the first one\'s hash survives', async () => {
		const env = mac({ apps: [ 'Cursor' ] });
		const svc = service(env);
		const failing = failingRegistry(env);
		const manual = (appHash: string) => ({ accountId: 'acc-a', appId: 'cursor', route: 'http', tier: 'large', recommendedTier: 'large', port: 31009, appHash, name: 'Cursor', grant: GRANT, expireAt: 0, expectedHash: null });

		await svc.list({ accountId: 'acc-a' });
		failing.on = true;
		expect(await svc.recordManual(manual('hash-m1'))).toMatchObject({ ok: true, recordSaved: false });
		expect(await svc.recordManual(manual('hash-m2'))).toEqual({ ok: false, error: { stage: 'write', category: 'unsaved' } });

		failing.on = false;
		await svc.list({ accountId: 'acc-a' });
		expect(recordOf(env)).toMatchObject({ appHash: 'hash-m1', method: 'manual' });
	});

	test('U21: after "I\'ve updated" Anytype makes the settings file private when others can read it, or says it couldn\'t', async () => {
		const env = mac({ apps: [ 'Cursor' ], files: { [CURSOR]: '{}' }, modes: { [CURSOR]: 0o644 } });
		const manual = { accountId: 'acc-a', appId: 'cursor', route: 'http', tier: 'large', recommendedTier: 'large', port: 31009, appHash: 'hash-m1', name: 'Cursor', grant: GRANT, expireAt: 0, expectedHash: null };

		expect(await service(env).recordManual(manual)).toMatchObject({ ok: true, fileMode: 'tightened' });
		expect(env.modeOf(CURSOR)).toBe(0o600);

		// Already private: nothing to say
		const again: any = await service(env).recordManual({ ...manual, appHash: 'hash-m2', expectedHash: 'hash-m1', connectionId: 'cursor' });

		expect(again.fileMode).toBeUndefined();

		// Another user's file: left as it is, reported
		const other = mac({ apps: [ 'Cursor' ], files: { [CURSOR]: '{}' }, modes: { [CURSOR]: 0o644 } });
		const lstat = other.lstat;

		other.lstat = p => {
			const st = lstat(p);
			return (st && (p == CURSOR)) ? { ...st, uid: 0 } : st;
		};
		expect(await service(other).recordManual(manual)).toMatchObject({ ok: true, fileMode: 'loose' });
		expect(other.modeOf(CURSOR)).toBe(0o644);
	});
});

describe('service: phase 2 final round', () => {
	test('final 4: an unsaved committed record survives a profile switch and is saved into its own registry once it can be', async () => {
		const env = mac({ apps: [ 'Cursor' ], dirs: [ '/Users/me/other-profile' ] });
		const svc = service(env);
		const rename = env.rename;
		let failing = false;

		env.rename = (from, to) => {
			if (failing && (to == REGISTRY)) {
				throw Object.assign(new Error('EACCES'), { code: 'EACCES' });
			};
			rename(from, to);
		};

		await svc.apply(applyParam());
		failing = true;
		expect(await svc.apply(applyParam({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }))).toMatchObject({ ok: true, recordSaved: false });

		await svc.setUserData('/Users/me/other-profile');
		// The other profile works normally meanwhile
		expect(((await svc.list({ accountId: 'acc-a' })) as any).connections).toEqual([]);

		failing = false;
		await svc.list({ accountId: 'acc-a' });
		expect(recordOf(env)).toMatchObject({ appHash: 'hash-a2', revokePending: [ 'hash-a1' ] });
		expect(env.readText('/Users/me/other-profile/aiConnect.json') || '').not.toContain('hash-a2');
	});

	test('final 7: "I\'ve updated" never chmods a file that resolves outside home, or another file than the previewed one', async () => {
		const outside = mac({ apps: [ 'Cursor' ], files: { '/opt/shared/mcp.json': '{}' }, modes: { '/opt/shared/mcp.json': 0o644 }, links: { '/Users/me/.cursor/mcp.json': '/opt/shared/mcp.json' } });
		const manual = { accountId: 'acc-a', appId: 'cursor', route: 'http', tier: 'large', recommendedTier: 'large', port: 31009, appHash: 'hash-m1', name: 'Cursor', grant: GRANT, expireAt: 0, expectedHash: null };

		expect(await service(outside).recordManual(manual)).toMatchObject({ ok: true, fileMode: 'loose' });
		expect(outside.modeOf('/opt/shared/mcp.json')).toBe(0o644);

		const moved = mac({ apps: [ 'Cursor' ], files: { [CURSOR]: '{}' }, modes: { [CURSOR]: 0o644 } });

		expect(await service(moved).recordManual({ ...manual, previewTarget: '/Users/me/elsewhere/mcp.json' })).toMatchObject({ ok: true, fileMode: 'loose' });
		expect(moved.modeOf(CURSOR)).toBe(0o644);
	});
});
