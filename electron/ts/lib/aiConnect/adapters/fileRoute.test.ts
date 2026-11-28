/**
 * Route A adapters (Cursor, VS Code + Copilot, ChatGPT / Codex) through the real service on a fake Mac.
 */
import { describe, expect, test, vi } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: () => '/nonexistent', getVersion: () => '0.0.0', getFileIcon: vi.fn(), getApplicationInfoForProtocol: vi.fn() }, shell: { openExternal: vi.fn(), showItemInFolder: vi.fn() } }));
vi.mock('electron-util', () => ({ fixPathForAsarUnpack: (p: string) => p }));

import { GRANT, KEY_A, KEY_B, REGISTRY, applyParam, keysOf, mac, planParam, service } from '../testKit';
import { keyFingerprint } from '../digest';
import { canonicalDigest } from '../digest';
import { readJson } from '../jsonFile';
import type { AiRecord, Env } from '../types';

const CURSOR = '/Users/me/.cursor/mcp.json';
const CODEX = '/Users/me/.codex/config.toml';

const record = (env: Env, accountId: string, id: string): AiRecord => JSON.parse(env.readText(REGISTRY)).connections.find((c: AiRecord) => (c.accountId == accountId) && (c.id == id));

const cursorEntry = (key: string, port = 31009, tier = 'large') => ({ url: `http://127.0.0.1:${port}/mcp/${tier}`, headers: { Authorization: `Bearer ${key}` } });

describe('Cursor (jsonEntry)', () => {
	test('first install into a missing file: the planned entry, 0600, a created dir that is not install evidence', async () => {
		const env = mac({ apps: [ 'Cursor' ] });
		const svc = service(env);
		const plan: any = await svc.plan(planParam());

		expect(plan).toMatchObject({ ok: true, canApply: true, existing: 'none', method: 'config', nextStep: 'restart', displayTarget: '~/.cursor/mcp.json', targetId: 'cursor' });
		expect(plan.steps[1].snippet).toContain('Bearer <KEY>');
		expect(JSON.stringify(plan)).not.toContain(KEY_A);

		const res: any = await svc.apply(applyParam());

		expect(res).toMatchObject({ ok: true, connection: { id: 'cursor', targetPath: CURSOR, method: 'config', nextStep: 'restart', observedInstalled: true, createdDirs: [ '/Users/me/.cursor' ] } });
		expect(JSON.parse(env.files()[CURSOR])).toEqual({ mcpServers: { anytype: cursorEntry(KEY_A) } });
		expect(env.modeOf(CURSOR)).toBe(0o600);
		// apply wrote exactly the planned entry (the plan's snippet with the key filled in)
		expect(JSON.parse(plan.steps[1].snippet.replace('<KEY>', KEY_A))).toEqual({ mcpServers: { anytype: cursorEntry(KEY_A) } });
	});

	test('other servers and comments are kept; a reapply with the same key changes nothing', async () => {
		// A comment on its own line (one sharing the insertion's line is refused: J8)
		const original = '{\n  // my servers\n  "mcpServers": {\n    // keep\n    "other": { "url": "http://x" },\n  },\n}\n';
		const env = mac({ apps: [ 'Cursor' ], files: { [CURSOR]: original } });
		const svc = service(env);

		await svc.apply(applyParam());

		const once = env.files()[CURSOR];

		// Comments stay, the other server stays byte for byte
		expect(once).toContain('// my servers');
		expect(once).toContain('// keep');
		expect({ ...(readJson(once) as any).value.mcpServers.other }).toEqual({ url: 'http://x' });
		// A file Anytype writes a key into keeps no backup copy (tokens-plan §1)
		expect(env.files()[CURSOR + '.anytype-backup']).toBeUndefined();

		expect(await svc.apply(applyParam({ expectedHash: 'hash-a1' }))).toMatchObject({ ok: true });
		expect(env.files()[CURSOR]).toBe(once);
	});

	test('unparseable: manual plan, apply refused, bytes unchanged', async () => {
		const env = mac({ apps: [ 'Cursor' ], files: { [CURSOR]: '{ "mcpServers": ' } });
		const svc = service(env);

		expect(await svc.plan(planParam())).toMatchObject({ ok: true, canApply: false, method: 'manual', error: { stage: 'parse', category: 'unparseable' } });
		expect(await svc.apply(applyParam())).toEqual({ ok: false, error: { stage: 'parse', category: 'unparseable', path: CURSOR } });
		expect(env.files()[CURSOR]).toBe('{ "mcpServers": ');
	});

	test('removed only after the entry was observed, else pending', async () => {
		const env = mac({ apps: [ 'Cursor' ] });
		const svc = service(env);

		await svc.apply(applyParam());
		env.unlink(CURSOR);

		expect((await svc.check({ accountId: 'acc-a', apiListening: true, port: 31009, keys: null }) as any).connections[0].status).toBe('removed');

		// A never-observed record (e.g. delivered by a deeplink) is pending, not removed
		const env2 = mac({ apps: [ 'Cursor' ] });
		const svc2 = service(env2);

		await svc2.apply(applyParam());
		const rec = record(env2, 'acc-a', 'cursor');
		env2.unlink(REGISTRY);
		env2.writeFile(REGISTRY, JSON.stringify({ version: 1, nudgeClaimed: false, connections: [ { ...rec, observedInstalled: false } ] }), 0o600).close();
		env2.unlink(CURSOR);

		expect((await service(env2).check({ accountId: 'acc-a', apiListening: true, port: 31009, keys: null }) as any).connections[0].status).toBe('pending');
	});

	test('heal: a port change rewrites with the key from the file and persists the reload step (R2-20)', async () => {
		const env = mac({ apps: [ 'Cursor' ] });
		const svc = service(env);

		await svc.apply(applyParam());
		await svc.stepDone({ accountId: 'acc-a', connectionId: 'cursor' });
		expect(record(env, 'acc-a', 'cursor').nextStep).toBe('none');

		const res: any = await svc.check({ accountId: 'acc-a', apiListening: true, port: 31010, keys: keysOf([ 'hash-a1' ]) });

		expect(res.healed).toEqual([ 'cursor' ]);
		expect(JSON.parse(env.files()[CURSOR]).mcpServers.anytype).toEqual(cursorEntry(KEY_A, 31010));
		expect(record(env, 'acc-a', 'cursor').nextStep).toBe('restart');
	});

	test('without a listening API, check heals nothing (and runs no adapter)', async () => {
		const env = mac({ apps: [ 'Cursor' ] });
		const svc = service(env);

		await svc.apply(applyParam());

		const before = env.files()[CURSOR];

		expect(await svc.check({ accountId: 'acc-a', apiListening: false, keys: keysOf([ 'hash-a1' ]) })).toMatchObject({ ok: true, healed: [] });
		expect(env.files()[CURSOR]).toBe(before);
	});

	test('owned fields (R3-5): a hand-edited host is not ours: conflict on heal and on remove, bytes unchanged', async () => {
		const env = mac({ apps: [ 'Cursor' ] });
		const svc = service(env);

		await svc.apply(applyParam());

		const edited = JSON.stringify({ mcpServers: { anytype: { ...cursorEntry(KEY_A), url: 'http://evil.example:31009/mcp/large' } } });

		env.unlink(CURSOR);
		env.writeFile(CURSOR, edited, 0o600).close();

		expect((await svc.check({ accountId: 'acc-a', apiListening: true, port: 31010, keys: null }) as any).connections[0].status).toBe('conflict');
		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'cursor', expectedHash: 'hash-a1' })).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(env.files()[CURSOR]).toBe(edited);
	});

	test('a file edited mid-flight: one re-plan (ownership checked again), then `changed`', async () => {
		const env = mac({ apps: [ 'Cursor' ], files: { [CURSOR]: '{}' } });
		const svc = service(env);
		const chmod = env.chmod;
		let edits = 0;

		// The app rewrites its file every time our temp file is ready
		env.chmod = (p, mode) => {
			chmod(p, mode);
			if (p.includes('.new-')) {
				edits++;
				env.unlink(CURSOR);
				env.writeFile(CURSOR, `{ "n": ${edits} }`, 0o600).close();
			};
		};

		expect(await svc.apply(applyParam())).toEqual({ ok: false, error: { stage: 'write', category: 'changed', path: CURSOR } });
		expect(edits).toBe(2);
		expect(env.files()[CURSOR]).toBe('{ "n": 2 }');
	});

	test('ownership across accounts: B replaces A only with consent; A then sees conflict and leaves B\'s entry alone', async () => {
		const env = mac({ apps: [ 'Cursor' ] });
		const svc = service(env);

		await svc.apply(applyParam());

		const planB: any = await svc.plan(planParam({ accountId: 'acc-b' }));

		expect(planB).toMatchObject({ existing: 'foreign', replace: { targetPath: CURSOR, foreignDigest: canonicalDigest(cursorEntry(KEY_A)) } });
		expect(await svc.apply(applyParam({ accountId: 'acc-b', key: KEY_B, appHash: 'hash-b1' }))).toEqual({ ok: false, error: { stage: 'validate', category: 'conflict', path: CURSOR } });
		// Replace bound to what was shown (R3-6): another digest or path is refused
		expect(await svc.apply(applyParam({ accountId: 'acc-b', key: KEY_B, appHash: 'hash-b1', replace: { ...planB.replace, foreignDigest: 'f'.repeat(64) } }))).toMatchObject({ ok: false, error: { category: 'conflict' } });
		// A Replace naming a file that isn't Cursor's: the preview no longer holds
		expect(await svc.apply(applyParam({ accountId: 'acc-b', key: KEY_B, appHash: 'hash-b1', replace: { ...planB.replace, targetPath: '/Users/me/other.json' } }))).toMatchObject({ ok: false, error: { category: 'changed' } });
		expect(await svc.apply(applyParam({ accountId: 'acc-b', key: KEY_B, appHash: 'hash-b1', replace: planB.replace }))).toMatchObject({ ok: true });

		const bytes = env.files()[CURSOR];

		expect(JSON.parse(bytes).mcpServers.anytype).toEqual(cursorEntry(KEY_B));
		expect((await svc.check({ accountId: 'acc-a', apiListening: true, port: 31010, keys: null }) as any).connections[0].status).toBe('conflict');
		expect(await svc.update({ accountId: 'acc-a', connectionId: 'cursor', expectedHash: 'hash-a1', port: 31011 })).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'cursor', expectedHash: 'hash-a1' })).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(env.files()[CURSOR]).toBe(bytes);
		// Forget skips the cleanup and still retires A's key
		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'cursor', expectedHash: 'hash-a1', forget: true })).toMatchObject({ ok: true, connection: { removed: true, revokePending: [ 'hash-a1' ] } });
		expect(env.files()[CURSOR]).toBe(bytes);
	});

	test('the foreign entry changes during a writer retry → conflict (R3-6)', async () => {
		const env = mac({ apps: [ 'Cursor' ], files: { [CURSOR]: JSON.stringify({ mcpServers: { anytype: cursorEntry(KEY_B) } }) } });
		const svc = service(env);
		const plan: any = await svc.plan(planParam());
		const chmod = env.chmod;
		let once = false;

		env.chmod = (p, mode) => {
			chmod(p, mode);
			if (!once && p.includes('.new-')) {
				once = true;
				env.unlink(CURSOR);
				env.writeFile(CURSOR, JSON.stringify({ mcpServers: { anytype: cursorEntry('SENTINEL-third-party-key-000') } }), 0o600).close();
			};
		};

		expect(await svc.apply(applyParam({ replace: plan.replace }))).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(JSON.parse(env.files()[CURSOR]).mcpServers.anytype.headers.Authorization).toBe('Bearer SENTINEL-third-party-key-000');
	});

	test('post-commit: `agent mcp enable anytype` when the agent CLI exists; its failure is ignored', async () => {
		const env = mac({ apps: [ 'Cursor' ], files: { '/usr/local/bin/agent': '' }, shell: { agent: '/usr/local/bin/agent' }, run: call => (call.file == '/usr/local/bin/agent') ? { code: 3, stdout: '' } : null });
		const svc = service(env);

		expect(await svc.apply(applyParam())).toMatchObject({ ok: true });
		expect(env.calls.filter(c => c.file == '/usr/local/bin/agent').map(c => c.args)).toEqual([ [ 'mcp', 'enable', 'anytype' ] ]);
		expect(env.calls.every(c => !c.args.join(' ').includes(KEY_A))).toBe(true);
	});
});

describe('VS Code + GitHub Copilot', () => {
	test('entry with type and tools; the step follows the evidence', async () => {
		const file = '/Users/me/.copilot/mcp-config.json';
		const vscode = mac({ apps: [ 'Visual Studio Code' ] });
		const cli = mac({ files: { '/opt/homebrew/bin/copilot': '' }, shell: { copilot: '/opt/homebrew/bin/copilot' } });

		expect(await service(vscode).plan(planParam({ appId: 'vscode' }))).toMatchObject({ ok: true, targetId: 'copilot', nextStep: 'reloadServer', instructions: { reloadServer: 'aiConnectStepReloadServer' } });
		expect(await service(cli).plan(planParam({ appId: 'vscode' }))).toMatchObject({ instructions: { reloadServer: 'aiConnectStepCopilotCli' } });

		expect(await service(vscode).apply(applyParam({ appId: 'vscode', name: 'VS Code' }))).toMatchObject({ ok: true, connection: { id: 'copilot', nextStep: 'reloadServer' } });
		expect(JSON.parse(vscode.files()[file]).mcpServers.anytype).toEqual({ type: 'http', url: 'http://127.0.0.1:31009/mcp/large', headers: { Authorization: `Bearer ${KEY_A}` }, tools: [ '*' ] });
	});
});

describe('ChatGPT and Codex (TOML)', () => {
	const codexEntry = (key: string) => `[mcp_servers.anytype]\nurl = "http://127.0.0.1:31009/mcp/large"\nhttp_headers = { Authorization = "Bearer ${key}" }\n`;

	test('ChatGPT then Codex on the same file → one record; restart only because ChatGPT reads that file', async () => {
		const env = mac({ apps: [ 'ChatGPT' ], dirs: [ '/Users/me/.codex' ], files: { [CODEX]: '# mine\n[profile]\nx = 1\n' } });
		const svc = service(env);

		expect(await svc.plan(planParam({ appId: 'chatgpt' }))).toMatchObject({ ok: true, targetId: 'codex', nextStep: 'restart', instructions: { added: 'aiConnectChatgptModes', restart: 'aiConnectStepRestart' } });
		expect(await svc.apply(applyParam({ appId: 'chatgpt', name: 'ChatGPT' }))).toMatchObject({ ok: true, connection: { id: 'codex', nextStep: 'restart' } });
		expect(env.files()[CODEX]).toBe('# mine\n[profile]\nx = 1\n\n' + codexEntry(KEY_A));

		// The Codex card maps to the same record: the plan sees it as ours, nothing to connect again
		expect(await svc.plan(planParam({ appId: 'codex' }))).toMatchObject({ ok: true, targetId: 'codex', existing: 'ours' });
		expect((await svc.list({ accountId: 'acc-a' }) as any).connections.map((c: AiRecord) => c.id)).toEqual([ 'codex' ]);
	});

	test('a custom CODEX_HOME is another record and file; without ChatGPT reading it, a new session is the step', async () => {
		const env = mac({ apps: [ 'ChatGPT' ], dirs: [ '/Users/me/.codex', '/Users/me/work/codex' ], shell: { CODEX_HOME: '/Users/me/work/codex' } });
		const svc = service(env);

		await svc.apply(applyParam({ appId: 'chatgpt', name: 'ChatGPT' }));

		const custom: any = await svc.apply(applyParam({ appId: 'codex', name: 'Codex', key: KEY_B, appHash: 'hash-a2' }));

		expect(custom).toMatchObject({ ok: true, connection: { targetPath: '/Users/me/work/codex/config.toml', nextStep: 'newSession' } });
		expect(custom.connection.id).toMatch(/^codex-home-[0-9a-f]{8}$/);
		expect(env.files()['/Users/me/work/codex/config.toml']).toBe(codexEntry(KEY_B));
		expect(env.files()[CODEX]).toBe(codexEntry(KEY_A));
	});

	test('CODEX_HOME moved from A to B: the old record and its file stay untouched, before and after connecting B', async () => {
		const a = '/Users/me/codex-a/config.toml';
		const svcFor = (home: string, env?: any) => {
			const e = env || mac({ dirs: [ '/Users/me/codex-a', '/Users/me/codex-b' ], shell: { CODEX_HOME: home }, files: { '/usr/local/bin/codex': '' } });
			return { env: e, svc: service(e) };
		};
		const first = svcFor('/Users/me/codex-a');
		const res: any = await first.svc.apply(applyParam({ appId: 'codex', name: 'Codex' }));
		const idA = res.connection.id;
		const bytes = first.env.files()[a];

		// Same machine, the shell now says B
		const moved = mac({ dirs: [ '/Users/me/codex-a', '/Users/me/codex-b' ], shell: { CODEX_HOME: '/Users/me/codex-b' }, files: { ...first.env.files() } });
		const svc = service(moved);
		const plan: any = await svc.plan(planParam({ appId: 'codex' }));

		expect(plan).toMatchObject({ ok: true, existing: 'none' });
		expect(plan.targetId).not.toBe(idA);
		expect(await svc.apply(applyParam({ appId: 'codex', name: 'Codex', key: KEY_B, appHash: 'hash-b' }))).toMatchObject({ ok: true });
		expect(moved.files()[a]).toBe(bytes);
		expect(record(moved, 'acc-a', idA)).toMatchObject({ targetPath: a, appHash: 'hash-a1' });
	});

	test('a record is not notInstalled while a sibling card mapping to it is installed; no restart outside macOS', async () => {
		const env = mac({ apps: [ 'ChatGPT' ], dirs: [ '/Users/me/.codex' ] });
		const svc = service(env);

		await svc.apply(applyParam({ appId: 'codex', name: 'Codex' }));
		expect((await svc.check({ accountId: 'acc-a', apiListening: true, port: 31009, keys: null }) as any).connections[0].status).toBe('ok');

		const list: any = await svc.list({ accountId: 'acc-a' });

		expect(list.detections.find((d: any) => d.appId == 'chatgpt').canRestart).toBe(true);
		expect(list.detections.find((d: any) => d.appId == 'codex').canRestart).toBe(false);
	});

	test('ownership across accounts on the TOML file', async () => {
		const env = mac({ apps: [ 'ChatGPT' ], dirs: [ '/Users/me/.codex' ] });
		const svc = service(env);

		await svc.apply(applyParam({ appId: 'chatgpt' }));

		const planB: any = await svc.plan(planParam({ appId: 'chatgpt', accountId: 'acc-b' }));

		expect(planB.existing).toBe('foreign');
		expect(await svc.apply(applyParam({ appId: 'chatgpt', accountId: 'acc-b', key: KEY_B, appHash: 'hash-b1' }))).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(await svc.apply(applyParam({ appId: 'chatgpt', accountId: 'acc-b', key: KEY_B, appHash: 'hash-b1', replace: planB.replace }))).toMatchObject({ ok: true });

		const bytes = env.files()[CODEX];

		expect((await svc.check({ accountId: 'acc-a', apiListening: true, port: 31010, keys: null }) as any).connections[0].status).toBe('conflict');
		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'codex', expectedHash: 'hash-a1' })).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(env.files()[CODEX]).toBe(bytes);
		expect(bytes).toContain(KEY_B);
		expect(keyFingerprint(KEY_B)).toBe(record(env, 'acc-b', 'codex').keyFp);
	});

	test('a rejected CODEX_HOME: manual for Codex (never ChatGPT\'s file); ChatGPT still connects', async () => {
		const env = mac({ apps: [ 'ChatGPT' ], dirs: [ '/Users/me/.codex' ], shell: { CODEX_HOME: '/opt/elsewhere' } });
		const svc = service(env);

		expect(await svc.plan(planParam({ appId: 'codex' }))).toMatchObject({ ok: true, canApply: false, method: 'manual', error: { category: 'outsideHome' } });
		expect(await svc.apply(applyParam({ appId: 'codex' }))).toEqual({ ok: false, error: { stage: 'validate', category: 'unknown' } });
		expect(env.files()[CODEX]).toBeUndefined();
		expect(await svc.apply(applyParam({ appId: 'chatgpt' }))).toMatchObject({ ok: true });
		expect(GRANT).toEqual({ spaceIds: [], allSpaces: true, perm: 1 });
	});
});

describe('Route A: phase 2 review round 1', () => {
	const statusOf = async (svc: any, port = 31009, accountId = 'acc-a') => (await svc.check({ accountId, apiListening: true, port, keys: null }) as any).connections[0].status;
	const rewrite = (env: Env, file: string, text: string) => {
		env.unlink(file);
		env.writeFile(file, text, 0o600).close();
	};
	/** The app edits its file right when Anytype's temp file is ready (once) */
	const onTemp = (env: Env, fn: () => void) => {
		const chmod = env.chmod;
		let done = false;

		env.chmod = (p, mode) => {
			chmod(p, mode);
			if (!done && p.includes('.new-')) {
				done = true;
				fn();
			};
		};
	};

	test('T4: the entry removed in Cursor during a port heal is not put back; check says removed', async () => {
		const env = mac({ apps: [ 'Cursor' ] });
		const svc = service(env);

		await svc.apply(applyParam());
		onTemp(env, () => rewrite(env, CURSOR, '{ "mcpServers": {} }'));

		const res: any = await svc.check({ accountId: 'acc-a', apiListening: true, port: 31010, keys: null });

		expect(res).toMatchObject({ healed: [], connections: [ { status: 'removed' } ] });
		expect(env.files()[CURSOR]).toBe('{ "mcpServers": {} }');
	});

	test('T4: an update that finds its entry deleted mid-write stops (notFound); a rotation that does stops (changed); nothing re-added', async () => {
		const env = mac({ apps: [ 'Cursor' ] });
		const svc = service(env);

		await svc.apply(applyParam());
		onTemp(env, () => rewrite(env, CURSOR, '{}'));
		expect(await svc.update({ accountId: 'acc-a', connectionId: 'cursor', expectedHash: 'hash-a1', port: 31010 })).toMatchObject({ ok: false, error: { stage: 'read', category: 'notFound' } });
		expect(env.files()[CURSOR]).toBe('{}');

		const rot = mac({ apps: [ 'Cursor' ] });
		const svc2 = service(rot);

		await svc2.apply(applyParam());
		onTemp(rot, () => rewrite(rot, CURSOR, '{}'));
		expect(await svc2.apply(applyParam({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }))).toMatchObject({ ok: false, error: { stage: 'write', category: 'changed' } });
		expect(rot.files()[CURSOR]).toBe('{}');
	});

	test('T4: a Replace whose previewed entry is gone (before apply, or during the write) is refused', async () => {
		const env = mac({ apps: [ 'Cursor' ], files: { [CURSOR]: JSON.stringify({ mcpServers: { anytype: cursorEntry(KEY_B) } }) } });
		const svc = service(env);
		const plan: any = await svc.plan(planParam());

		rewrite(env, CURSOR, '{}');
		expect(await svc.apply(applyParam({ replace: plan.replace }))).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(env.files()[CURSOR]).toBe('{}');

		const race = mac({ apps: [ 'Cursor' ], files: { [CURSOR]: JSON.stringify({ mcpServers: { anytype: cursorEntry(KEY_B) } }) } });
		const svc2 = service(race);
		const plan2: any = await svc2.plan(planParam());

		onTemp(race, () => rewrite(race, CURSOR, '{}'));
		expect(await svc2.apply(applyParam({ replace: plan2.replace }))).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(race.files()[CURSOR]).toBe('{}');
	});

	test('T9: one service, CODEX_HOME moved from A to B: the plan and the write follow B, A is untouched', async () => {
		const shell: Record<string, string> = { CODEX_HOME: '/Users/me/codex-a' };
		const env = mac({ dirs: [ '/Users/me/codex-a', '/Users/me/codex-b' ], shell, files: { '/usr/local/bin/codex': '', '/Users/me/codex-a/config.toml': '# a\n' } });
		const svc = service(env);
		let clock = 1000;

		env.now = () => clock;
		expect(await svc.plan(planParam({ appId: 'codex' }))).toMatchObject({ displayTarget: '~/codex-a/config.toml' });

		shell.CODEX_HOME = '/Users/me/codex-b';
		clock += 61000;

		expect(await svc.plan(planParam({ appId: 'codex' }))).toMatchObject({ displayTarget: '~/codex-b/config.toml' });
		expect(await svc.apply(applyParam({ appId: 'codex', name: 'Codex' }))).toMatchObject({ ok: true, connection: { targetPath: '/Users/me/codex-b/config.toml' } });
		expect(env.files()['/Users/me/codex-a/config.toml']).toBe('# a\n');
		expect(env.files()['/Users/me/codex-b/config.toml']).toContain(KEY_A);
	});

	test('T11: a form the writer can\'t edit (an inline TOML table) is manual in the plan, before any key', async () => {
		const inline = 'mcp_servers = { anytype = { url = "http://example" } }\n';
		const env = mac({ apps: [ 'ChatGPT' ], dirs: [ '/Users/me/.codex' ], files: { [CODEX]: inline } });
		const svc = service(env);

		expect(await svc.plan(planParam({ appId: 'chatgpt' }))).toMatchObject({ ok: true, canApply: false, method: 'manual', error: { stage: 'parse', category: 'unsupportedForm' } });
		expect(env.files()[CODEX]).toBe(inline);
	});

	test('T15: a port heal persists the new port (also after a restart)', async () => {
		const env = mac({ apps: [ 'Cursor' ] });
		const svc = service(env);

		await svc.apply(applyParam());
		expect(await svc.check({ accountId: 'acc-a', apiListening: true, port: 31010, keys: null })).toMatchObject({ healed: [ 'cursor' ], connections: [ { port: 31010 } ] });
		expect(record(env, 'acc-a', 'cursor')).toMatchObject({ port: 31010, nextStep: 'restart' });
		expect(((await service(env).list({ accountId: 'acc-a' })) as any).connections[0].port).toBe(31010);
	});

	test('T21: a key in a file others can write is not reused for a heal: needs attention, bytes unchanged', async () => {
		const env = mac({ apps: [ 'Cursor' ] });
		const svc = service(env);

		await svc.apply(applyParam());
		env.chmod(CURSOR, 0o666);

		const bytes = env.files()[CURSOR];

		expect(await statusOf(svc, 31010)).toBe('reconnect');
		expect(await svc.update({ accountId: 'acc-a', connectionId: 'cursor', expectedHash: 'hash-a1', port: 31010 })).toMatchObject({ ok: false, error: { category: 'permission' } });
		expect(env.files()[CURSOR]).toBe(bytes);
	});

	test('T25: the record\'s creating card is gone, its sibling is installed: not notInstalled (sharing by canonical path)', async () => {
		// Codex (its CLI) connected first; Anytype created ~/.codex, which is no install evidence afterwards
		const first = mac({ apps: [ 'ChatGPT' ], files: { '/usr/local/bin/codex': '' }, shell: { codex: '/usr/local/bin/codex' } });

		expect(await service(first).apply(applyParam({ appId: 'codex', name: 'Codex' }))).toMatchObject({ ok: true, connection: { createdDirs: [ '/Users/me/.codex' ] } });

		// Later: the Codex CLI is uninstalled; ChatGPT still reads ~/.codex/config.toml
		const later = mac({ apps: [ 'ChatGPT' ], files: { [REGISTRY]: first.files()[REGISTRY], [CODEX]: first.files()[CODEX] } });
		const svc = service(later);
		const list: any = await svc.list({ accountId: 'acc-a' });

		expect(list.detections.find((d: any) => d.appId == 'codex').installed).toBe(false);
		expect(list.detections.find((d: any) => d.appId == 'chatgpt').installed).toBe(true);
		expect(record(later, 'acc-a', 'codex').appId).toBe('codex');
		expect(await statusOf(svc)).toBe('ok');
	});

	test('T25 / U23: CODEX_HOME moved back onto the default ChatGPT owns: Codex maps to that record as is; both earlier connections survive unchanged', async () => {
		const custom = '/Users/me/work/codex/config.toml';
		const shell: Record<string, string> = { codex: '/usr/local/bin/codex', CODEX_HOME: '/Users/me/work/codex' };
		const env = mac({ apps: [ 'ChatGPT' ], dirs: [ '/Users/me/.codex', '/Users/me/work/codex' ], files: { '/usr/local/bin/codex': '' }, shell });
		let clock = 1000;

		env.now = () => clock;

		const svc = service(env);

		// Both locations connected first, with distinct keys: ChatGPT at the default, Codex at the custom home
		expect(await svc.apply(applyParam({ appId: 'chatgpt', name: 'ChatGPT' }))).toMatchObject({ ok: true, connection: { id: 'codex' } });

		const customRes: any = await svc.apply(applyParam({ appId: 'codex', name: 'Codex', key: KEY_B, appHash: 'hash-b1' }));

		expect(customRes).toMatchObject({ ok: true, connection: { targetPath: custom } });

		const before = { def: env.files()[CODEX], custom: env.files()[custom], defRec: record(env, 'acc-a', 'codex'), customRec: record(env, 'acc-a', customRes.connection.id) };

		// CODEX_HOME unset again
		delete shell.CODEX_HOME;
		clock += 61000;

		const plan: any = await svc.plan(planParam({ appId: 'codex' }));

		expect(plan).toMatchObject({ ok: true, targetId: 'codex', existing: 'ours', displayTarget: '~/.codex/config.toml' });
		expect(((await svc.list({ accountId: 'acc-a' })) as any).detections.find((d: any) => d.appId == 'codex')).toMatchObject({ targetId: 'codex', targetPaths: [ CODEX ] });
		expect(env.files()[CODEX]).toBe(before.def);
		expect(env.files()[custom]).toBe(before.custom);
		expect(record(env, 'acc-a', 'codex')).toEqual(before.defRec);
		expect(record(env, 'acc-a', customRes.connection.id)).toEqual(before.customRec);
	});
});

describe('Route A: phase 2 review round 2', () => {
	const A = '/Users/me/codex-a/config.toml';
	const B = '/Users/me/codex-b/config.toml';
	const codexMachine = (files: Record<string, string> = {}) => {
		const shell: Record<string, string> = { codex: '/usr/local/bin/codex', CODEX_HOME: '/Users/me/codex-a' };
		const env = mac({ dirs: [ '/Users/me/codex-a', '/Users/me/codex-b' ], shell, files: { '/usr/local/bin/codex': '', ...files } });
		let clock = 1000;

		env.now = () => clock;
		return { env, shell, svc: service(env), later: () => clock += 61000, soon: () => clock += 100 };
	};

	test('U4: CODEX_HOME moved right after the preview (inside the resolver cache window): apply refuses the previewed place, writes nowhere', async () => {
		const { env, shell, svc, soon } = codexMachine();
		const plan: any = await svc.plan(planParam({ appId: 'codex' }));

		expect(plan).toMatchObject({ ok: true, targetPath: A });

		shell.CODEX_HOME = '/Users/me/codex-b';
		soon();

		expect(await svc.apply(applyParam({ appId: 'codex', name: 'Codex', previewTarget: plan.targetPath }))).toEqual({ ok: false, error: { stage: 'write', category: 'changed' } });
		expect(env.files()[A]).toBeUndefined();
		expect(env.files()[B]).toBeUndefined();

		// A fresh preview shows B (apply refreshed the resolver); delivering to it is fine
		const again: any = await svc.plan(planParam({ appId: 'codex' }));

		expect(again.targetPath).toBe(B);
		expect(await svc.apply(applyParam({ appId: 'codex', name: 'Codex', previewTarget: again.targetPath }))).toMatchObject({ ok: true, connection: { targetPath: B } });
	});

	test('U4: a Replace approved for A is refused once Codex points at B (never a "first install" into B)', async () => {
		const { env, shell, svc, later } = codexMachine({ [A]: '[mcp_servers.anytype]\nurl = "http://127.0.0.1:31009/mcp/large"\nhttp_headers = { Authorization = "Bearer SENTINEL-foreign-key-000000" }\n' });
		const plan: any = await svc.plan(planParam({ appId: 'codex' }));
		const bytes = env.files()[A];

		expect(plan).toMatchObject({ existing: 'foreign', replace: { targetPath: A } });
		shell.CODEX_HOME = '/Users/me/codex-b';
		later();

		expect(await svc.apply(applyParam({ appId: 'codex', name: 'Codex', replace: plan.replace }))).toEqual({ ok: false, error: { stage: 'write', category: 'changed' } });
		expect(env.files()[A]).toBe(bytes);
		expect(env.files()[B]).toBeUndefined();
	});

	test('U4: an update after the home moved (with or without the cache expired) is refused; the old file stays byte-identical', async () => {
		const { env, shell, svc, soon } = codexMachine();
		const res: any = await svc.apply(applyParam({ appId: 'codex', name: 'Codex' }));
		const bytes = env.files()[A];

		shell.CODEX_HOME = '/Users/me/codex-b';
		soon();

		expect(await svc.update({ accountId: 'acc-a', connectionId: res.connection.id, expectedHash: 'hash-a1', port: 31010 })).toEqual({ ok: false, error: { stage: 'write', category: 'changed' } });
		expect(env.files()[A]).toBe(bytes);
		// Disconnect still cleans the stored old location
		expect(await svc.remove({ accountId: 'acc-a', connectionId: res.connection.id, expectedHash: 'hash-a1' })).toMatchObject({ ok: true });
		expect(env.files()[A]).not.toContain(KEY_A);
	});

	test('U17: a target three missing directories deep is manual in the plan (the writer creates at most two)', async () => {
		const shell: Record<string, string> = { codex: '/usr/local/bin/codex', CODEX_HOME: '/Users/me/a/b/c' };
		const env = mac({ shell, files: { '/usr/local/bin/codex': '' } });

		expect(await service(env).plan(planParam({ appId: 'codex' }))).toMatchObject({ ok: true, canApply: false, error: { stage: 'write', category: 'notFound' } });
	});

	test('U19: a config folder that resolves into Anytype\'s own profile folder (logs, registry) is never written', async () => {
		const logs = '/Users/me/Library/Application Support/anytype/logs';
		const env = mac({ apps: [ 'Cursor' ], dirs: [ logs ], links: { '/Users/me/.cursor': logs } });
		const svc = service(env);

		// final 7: no key-bearing manual steps either (the user would put the key exactly where Anytype must not)
		expect(await svc.plan(planParam())).toMatchObject({ ok: true, canApply: false, error: { stage: 'write', category: 'permission' }, steps: [] });
		expect(await svc.apply(applyParam())).toMatchObject({ ok: false, error: { stage: 'write', category: 'permission' } });
		expect(Object.keys(env.files()).filter(p => p.startsWith(logs))).toEqual([]);
		expect(Object.entries(env.files()).filter(([ , t ]) => t.includes(KEY_A))).toEqual([]);
	});
});
