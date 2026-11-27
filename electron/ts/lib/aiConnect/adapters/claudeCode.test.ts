import { describe, expect, test, vi } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: () => '/nonexistent', getVersion: () => '0.0.0', getFileIcon: vi.fn(), getApplicationInfoForProtocol: vi.fn() }, shell: { openExternal: vi.fn(), showItemInFolder: vi.fn() } }));
vi.mock('electron-util', () => ({ fixPathForAsarUnpack: (p: string) => p }));

import { KEY_A, KEY_B, KEY_C, MCP_DIR, REGISTRY, applyParam, keysOf, mac, planParam, service } from '../testKit';
import { keyFingerprint } from '../digest';
import { fakeEnv, type FakeEnv, type RunCall } from '../testEnv';
import type { AiRecord, RunResult } from '../types';

const CLAUDE = '/Users/me/.local/bin/claude';
const SETTINGS = '/Users/me/.claude/settings.json';
const SKILL = '/Users/me/.claude/skills/anytype-api/SKILL.md';
const PROFILE = '/Users/me/.claude.json';
const VENDORED = '---\nname: anytype-api\ndescription: Anytype\n---\n# Anytype API\nbody\n';
const PREAMBLE = '<!-- anytype-desktop:begin -->\n## Connected by Anytype Desktop\n<!-- anytype-desktop:end -->\n';
const BUILT = '---\nname: anytype-api\ndescription: Anytype\n---\n\n<!-- anytype-desktop:begin -->\n## Connected by Anytype Desktop\n<!-- anytype-desktop:end -->\n# Anytype API\nbody\n';

type AddMode = 'ok' | 'fail' | 'failRemovesOld' | 'timeoutAfterWrite' | 'indeterminate' | 'zeroNoWrite' | 'failUnreadable';
type RemoveMode = 'ok' | 'keep' | 'indeterminate';

/** A fake `claude` CLI that edits its own config file the way the real one does */
const claudeCli = (get: () => FakeEnv, opt: { version?: string; add?: AddMode; remove?: RemoveMode } = {}) => (call: RunCall): RunResult | null => {
	if (call.file != CLAUDE) {
		return null;
	};

	const env = get();
	const dir = call.opts.env?.CLAUDE_CONFIG_DIR;
	const file = dir ? `${dir}/.claude.json` : `${call.opts.env?.HOME}/.claude.json`;
	const read = () => JSON.parse(env.readText(file) || '{}');
	const save = (doc: any) => {
		if (env.exists(file)) {
			env.unlink(file);
		};
		env.writeFile(file, JSON.stringify(doc), 0o600).close();
	};
	const [ a, b ] = call.args;

	if (a == '--version') {
		return { code: 0, stdout: `${opt.version || '2.1.332'} (Claude Code)\n` };
	};
	if ((a == 'mcp') && (b == 'remove')) {
		const doc = read();

		switch (opt.remove || 'ok') {
			case 'keep': return { code: 1, stdout: '' };
			case 'indeterminate': return { code: -1, stdout: '', timedOut: true, indeterminate: true };
		};
		delete doc.mcpServers?.anytype;
		save(doc);
		return { code: 0, stdout: '' };
	};
	if ((a == 'mcp') && (b == 'add-json')) {
		const doc = read();
		const install = () => save({ ...doc, mcpServers: { ...(doc.mcpServers || {}), anytype: JSON.parse(call.opts.stdin) } });

		switch (opt.add || 'ok') {
			case 'ok': install(); return { code: 0, stdout: '' };
			case 'fail': return { code: 1, stdout: '' };
			case 'failRemovesOld': return { code: 1, stdout: '' };
			case 'timeoutAfterWrite': install(); return { code: -1, stdout: '', timedOut: true };
			case 'indeterminate': return { code: -1, stdout: '', timedOut: true, indeterminate: true };
			case 'zeroNoWrite': return { code: 0, stdout: '' };
			case 'failUnreadable': {
				if (env.exists(file)) {
					env.unlink(file);
				};
				env.writeFile(file, '{ half-written', 0o600).close();
				return { code: 1, stdout: '' };
			};
		};
	};
	if ((a == 'mcp') && (b == 'get')) {
		return { code: read().mcpServers?.anytype ? 0 : 1, stdout: '' };
	};
	return { code: 1, stdout: '' };
};

/** A Mac with Claude Code (its CLI, home dir and the built skill in dist) */
const machine = (opt: { files?: Record<string, string>; shell?: Record<string, string>; version?: string; add?: AddMode; remove?: RemoveMode; dirs?: string[]; noClaudeDir?: boolean; links?: Record<string, string>; modes?: Record<string, number> } = {}) => {
	let env: FakeEnv = null;
	// Mutable: a test can change what the login shell answers (then `later()` lets the 60 s resolver cache expire)
	const shell: Record<string, string> = { claude: CLAUDE, ...(opt.shell || {}) };

	env = mac({
		dirs: [ ...(opt.noClaudeDir ? [] : [ '/Users/me/.claude' ]), ...(opt.dirs || []) ],
		files: { [CLAUDE]: '', [`${MCP_DIR}/skill/SKILL.md`]: VENDORED, [`${MCP_DIR}/skill/PREAMBLE.md`]: PREAMBLE, ...(opt.files || {}) },
		links: opt.links,
		modes: opt.modes,
		shell,
		run: claudeCli(() => env, { version: opt.version, add: opt.add, remove: opt.remove }),
	});

	let clock = 1000;

	env.now = () => clock;
	return { env, shell, svc: service(env), later: () => clock += 61000 };
};

const cc = (over: Record<string, any> = {}) => applyParam({ appId: 'claude-code', name: 'Claude Code', route: 'skill', ...over });
const record = (env: FakeEnv): AiRecord => JSON.parse(env.readText(REGISTRY)).connections[0];
const cliCalls = (env: FakeEnv) => env.calls.filter(c => c.file == CLAUDE);

describe('Claude Code: skill route', () => {
	test('the marked skill and the two env values; unrelated env keys kept', async () => {
		const { env, svc } = machine({ files: { [SETTINGS]: JSON.stringify({ env: { FOO: 'bar' }, model: 'x' }, null, 2) } });
		const res: any = await svc.apply(cc());

		expect(res).toMatchObject({ ok: true, connection: { route: 'skill', method: 'config', nextStep: 'newSession', targetPath: SETTINGS } });
		expect(JSON.parse(env.files()[SETTINGS])).toEqual({ env: { FOO: 'bar', ANYTYPE_API_URL: 'http://127.0.0.1:31009', ANYTYPE_API_KEY: KEY_A }, model: 'x' });
		expect(env.files()[SKILL]).toBe(BUILT);
	});

	test('sandbox on (macOS) → MCP tools with the note; sandbox settings are never written', async () => {
		const settings = JSON.stringify({ sandbox: { enabled: true, network: { allowedDomains: [] } } });
		const { env, svc } = machine({ files: { [SETTINGS]: settings } });

		expect(await svc.plan(planParam({ appId: 'claude-code', route: 'skill' }))).toMatchObject({ ok: true, route: 'http', method: 'cli', note: 'aiConnectNoteSandbox' });
		expect(await svc.apply(cc())).toMatchObject({ ok: true, connection: { route: 'http', method: 'cli' } });
		expect(env.files()[SETTINGS]).toBe(settings);
		expect(env.files()[SKILL]).toBeUndefined();
	});

	test.each([
		[ 'linux', '/home/me', '/home/me/.claude/settings.json', '/home/me/.claude' ],
		[ 'win32', 'C:\\Users\\me', 'C:\\Users\\me\\.claude\\settings.json', 'C:\\Users\\me\\.claude' ],
	])('sandbox on (%s) → the plan switches to MCP tools with the note', async (platform, home, settings, dir) => {
		const env = fakeEnv({ platform: platform as NodeJS.Platform, home, dirs: [ dir, (platform == 'win32') ? 'C:\\Users\\me\\AppData\\Roaming\\anytype' : '/home/me/.config/anytype' ], files: { [settings]: JSON.stringify({ sandbox: { enabled: true } }) } });
		const registry = (platform == 'win32') ? 'C:\\Users\\me\\AppData\\Roaming\\anytype\\aiConnect.json' : '/home/me/.config/anytype/aiConnect.json';

		expect(await service(env, registry).plan(planParam({ appId: 'claude-code', route: 'skill' }))).toMatchObject({ ok: true, route: 'http', note: 'aiConnectNoteSandbox' });
		expect(env.files()[settings]).toBe(JSON.stringify({ sandbox: { enabled: true } }));
	});

	test('an unmarked SKILL.md is the user\'s: conflict, bytes unchanged; a marked one from another build is refreshed', async () => {
		const mine = '---\nname: anytype-api\n---\nmy own\n';
		const user = machine({ files: { [SKILL]: mine, [SETTINGS]: '{}' } });

		expect(await user.svc.plan(planParam({ appId: 'claude-code', route: 'skill' }))).toMatchObject({ ok: true, canApply: false, error: { category: 'conflict' }, note: 'aiConnectSkillConflict' });
		expect(await user.svc.apply(cc())).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(user.env.files()[SKILL]).toBe(mine);
		expect(user.env.files()[SETTINGS]).toBe('{}');

		const old = machine({ files: { [SKILL]: '<!-- anytype-desktop:begin -->old<!-- anytype-desktop:end -->', [SETTINGS]: '{}' } });

		expect(await old.svc.apply(cc())).toMatchObject({ ok: true });
		expect(old.env.files()[SKILL]).toBe(BUILT);
	});

	test('a settings failure removes only a skill file this call created', async () => {
		const fresh = machine({ files: { [SETTINGS]: '{ broken' } });

		expect(await fresh.svc.apply(cc())).toMatchObject({ ok: false, error: { stage: 'parse', category: 'unparseable' } });
		expect(fresh.env.files()[SKILL]).toBeUndefined();

		const kept = machine({ files: { [SETTINGS]: '{ broken', [SKILL]: BUILT } });

		expect(await kept.svc.apply(cc())).toMatchObject({ ok: false });
		expect(kept.env.files()[SKILL]).toBe(BUILT);
	});

	test('remove: the two env values, then only a marked SKILL.md, then its directory only when empty', async () => {
		const { env, svc } = machine({ files: { [SETTINGS]: JSON.stringify({ env: { FOO: 'bar' } }) } });

		await svc.apply(cc());
		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'claude-code', expectedHash: 'hash-a1' })).toMatchObject({ ok: true });
		expect(JSON.parse(env.files()[SETTINGS])).toEqual({ env: { FOO: 'bar' } });
		expect(env.files()[SKILL]).toBeUndefined();
		expect(env.dirs()).not.toContain('/Users/me/.claude/skills/anytype-api');

		const busy = machine({ files: { [SETTINGS]: '{}' } });

		await busy.svc.apply(cc());
		busy.env.writeFile('/Users/me/.claude/skills/anytype-api/notes.md', 'mine', 0o600).close();
		await busy.svc.remove({ accountId: 'acc-a', connectionId: 'claude-code', expectedHash: 'hash-a1' });
		expect(busy.env.files()['/Users/me/.claude/skills/anytype-api/notes.md']).toBe('mine');
	});

	test('check: ok, a port heal (new session step), conflict, removed', async () => {
		const { env, svc } = machine({ files: { [SETTINGS]: '{}' } });
		const status = async (port = 31009) => (await svc.check({ accountId: 'acc-a', apiListening: true, port, keys: null }) as any);

		await svc.apply(cc());
		expect((await status()).connections[0].status).toBe('ok');
		expect((await status(31010)).healed).toEqual([ 'claude-code' ]);
		expect(JSON.parse(env.files()[SETTINGS]).env.ANYTYPE_API_URL).toBe('http://127.0.0.1:31010');

		env.unlink(SETTINGS);
		env.writeFile(SETTINGS, JSON.stringify({ env: { ANYTYPE_API_URL: 'http://127.0.0.1:31010', ANYTYPE_API_KEY: KEY_B } }), 0o600).close();
		expect((await status(31010)).connections[0].status).toBe('conflict');

		env.unlink(SETTINGS);
		env.writeFile(SETTINGS, '{}', 0o600).close();
		expect((await status(31010)).connections[0].status).toBe('removed');
	});
});

describe('Claude Code: MCP route (the claude CLI)', () => {
	const mcp = (over: Record<string, any> = {}) => cc({ route: 'http', ...over });

	test('a CLI older than 2.1.327 → cliTooOld: manual, and nothing but --version runs', async () => {
		const { env, svc } = machine({ version: '2.1.326' });

		expect(await svc.plan(planParam({ appId: 'claude-code', route: 'http' }))).toMatchObject({ ok: true, canApply: false, method: 'manual', error: { category: 'cliTooOld' } });
		expect(await svc.apply(mcp())).toEqual({ ok: false, error: { stage: 'cli', category: 'cliTooOld' } });
		expect(cliCalls(env).map(c => c.args)).toEqual([ [ '--version' ], [ '--version' ] ]);
	});

	test('first install: no remove, exact argv, the JSON only on stdin, the key never in argv; HOME and CLAUDE_CONFIG_DIR as resolved', async () => {
		const { env, svc } = machine({ dirs: [ '/Users/me/cc' ], shell: { CLAUDE_CONFIG_DIR: '/Users/me/cc' } });
		const res: any = await svc.apply(mcp());

		expect(res).toMatchObject({ ok: true, connection: { route: 'http', method: 'cli', targetPath: '/Users/me/cc/.claude.json', observedInstalled: true, nextStep: 'newSession' } });

		const calls = cliCalls(env);

		// The exact readback verifies it: no `mcp get` (it would contact whatever server the name resolves to)
		expect(calls.map(c => c.args)).toEqual([ [ '--version' ], [ 'mcp', 'add-json', '--scope', 'user', 'anytype', '-' ] ]);
		expect(JSON.parse(calls[1].opts.stdin)).toEqual({ type: 'http', url: 'http://127.0.0.1:31009/mcp/large', headers: { Authorization: `Bearer ${KEY_A}` } });
		expect(calls.every(c => !c.args.join(' ').includes(KEY_A))).toBe(true);
		expect(calls.every(c => (c.opts.env.CLAUDE_CONFIG_DIR == '/Users/me/cc') && (c.opts.env.HOME == '/Users/me') && c.opts.tree)).toBe(true);
	});

	test('an existing own entry: remove first, then add', async () => {
		const { env, svc } = machine();

		await svc.apply(mcp());
		env.calls.length = 0;
		expect(await svc.apply(mcp({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }))).toMatchObject({ ok: true, connection: { revokePending: [ 'hash-a1' ] } });
		expect(cliCalls(env).map(c => c.args.slice(0, 2))).toEqual([ [ '--version' ], [ 'mcp', 'remove' ], [ 'mcp', 'add-json' ] ]);
	});

	test('add-json fails: the previous entry now gone → removedOld; a first install → plain cliFailed; no second attempt', async () => {
		const gone = machine({ add: 'failRemovesOld' });
		const doc = { mcpServers: { anytype: { type: 'http', url: 'http://127.0.0.1:31009/mcp/large', headers: { Authorization: `Bearer ${KEY_B}` } } } };

		gone.env.writeFile(PROFILE, JSON.stringify(doc), 0o600).close();

		const plan: any = await gone.svc.plan(planParam({ appId: 'claude-code', route: 'http' }));

		expect(await gone.svc.apply(mcp({ replace: plan.replace }))).toEqual({ ok: false, error: { stage: 'cli', category: 'cliFailed', removedOld: true } });
		expect(cliCalls(gone.env).filter(c => c.args[1] == 'add-json')).toHaveLength(1);

		const first = machine({ add: 'fail' });

		expect(await first.svc.apply(mcp())).toEqual({ ok: false, error: { stage: 'cli', category: 'cliFailed' } });
	});

	test('the old CLI entry is still there after `mcp remove`: plain cliFailed, the new key never sent, old bytes and hash kept (Q15)', async () => {
		const { env, svc } = machine({ remove: 'keep' });

		await svc.apply(mcp());

		const bytes = env.files()[PROFILE];

		env.calls.length = 0;
		expect(await svc.apply(mcp({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }))).toEqual({ ok: false, error: { stage: 'cli', category: 'cliFailed' } });
		expect(cliCalls(env).filter(c => c.args[1] == 'add-json')).toEqual([]);
		expect(env.files()[PROFILE]).toBe(bytes);
		expect(record(env)).toMatchObject({ appHash: 'hash-a1', revokePending: [] });
	});

	test('a remove whose end is unknown stops before the add (a late remove could delete the new entry) (T5)', async () => {
		const { env, svc } = machine({ remove: 'indeterminate' });

		await svc.apply(mcp());
		env.calls.length = 0;
		expect(await svc.apply(mcp({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }))).toEqual({ ok: false, error: { stage: 'cli', category: 'timeout' } });
		expect(cliCalls(env).filter(c => c.args[1] == 'add-json')).toEqual([]);
		expect(record(env)).toMatchObject({ appHash: 'hash-a1' });
	});

	test('after the add the file decides: a clean exit without the entry is the real state (removedOld); an unreadable readback is unconfirmed (T5)', async () => {
		const zero = machine({ add: 'zeroNoWrite' });

		expect(await zero.svc.apply(mcp())).toEqual({ ok: false, error: { stage: 'cli', category: 'cliFailed' } });

		const owned = machine();

		await owned.svc.apply(mcp());

		const cli = owned.env.run;

		owned.env.run = async (file, args, opts) => (args[1] == 'add-json') ? { code: 0, stdout: '' } : cli(file, args, opts);
		expect(await owned.svc.apply(mcp({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }))).toEqual({ ok: false, error: { stage: 'cli', category: 'cliFailed', removedOld: true } });

		const garbled = machine({ add: 'failUnreadable' });

		expect(await garbled.svc.apply(mcp())).toMatchObject({ ok: false, unconfirmed: true });
	});

	test('two unconfirmed rotations in a row keep every candidate; disconnect retires all of them (T5)', async () => {
		const { env, svc } = machine();

		await svc.apply(mcp());

		const cli = env.run;

		env.run = async (file, args, opts) => (args[1] == 'add-json') ? { code: -1, stdout: '', timedOut: true, indeterminate: true } : cli(file, args, opts);
		expect(await svc.apply(mcp({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }))).toMatchObject({ ok: false, unconfirmed: true });
		expect(await svc.apply(mcp({ key: KEY_C, appHash: 'hash-a3', expectedHash: 'hash-a1' }))).toMatchObject({ ok: false, unconfirmed: true });
		expect(record(env).unconfirmed.map(c => c.appHash)).toEqual([ 'hash-a2', 'hash-a3' ]);

		const removed: any = await svc.remove({ accountId: 'acc-a', connectionId: 'claude-code', expectedHash: 'hash-a1' });

		expect(removed.connection.revokePending.sort()).toEqual([ 'hash-a1', 'hash-a2', 'hash-a3' ]);
	});

	test('a skill connection rotated to MCP tools unconfirmed: the check reads the MCP profile the CLI wrote and keeps the installed key; the skill becomes `prior` (T5, T24)', async () => {
		const { env, svc } = machine({ files: { [SETTINGS]: '{}' } });

		await svc.apply(cc());

		const cli = env.run;

		// The CLI's end couldn't be confirmed; its write lands afterwards
		env.run = async (file, args, opts) => (args[1] == 'add-json') ? { code: -1, stdout: '', timedOut: true, indeterminate: true } : cli(file, args, opts);
		expect(await svc.apply(mcp({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }))).toMatchObject({ ok: false, unconfirmed: true });
		env.run = cli;
		env.writeFile(PROFILE, JSON.stringify({ mcpServers: { anytype: { type: 'http', url: 'http://127.0.0.1:31009/mcp/large', headers: { Authorization: `Bearer ${KEY_B}` } } } }), 0o600).close();

		await svc.check({ accountId: 'acc-a', apiListening: true, port: 31009, keys: keysOf([ 'hash-a1', 'hash-a2' ]) });
		expect(record(env)).toMatchObject({ appHash: 'hash-a2', keyFp: keyFingerprint(KEY_B), route: 'http', targetPath: PROFILE, revokePending: [ 'hash-a1' ], prior: { route: 'skill', targetPath: SETTINGS, keyFp: keyFingerprint(KEY_A) } });

		// Disconnect removes both: the MCP entry and the skill route's leftovers
		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'claude-code', expectedHash: 'hash-a2' })).toMatchObject({ ok: true });
		expect(JSON.parse(env.files()[PROFILE]).mcpServers.anytype).toBeUndefined();
		expect(JSON.parse(env.files()[SETTINGS])).toEqual({ env: {} });
		expect(env.files()[SKILL]).toBeUndefined();
	});

	test('add-json times out but the entry now carries the new key → ok (R3-1), no `mcp get`', async () => {
		const { env, svc } = machine({ add: 'timeoutAfterWrite' });

		expect(await svc.apply(mcp())).toMatchObject({ ok: true, connection: { observedInstalled: true } });
		expect(cliCalls(env).some(c => c.args[1] == 'get')).toBe(false);
	});

	test('a timeout whose end could not be confirmed: `unconfirmed`, the key kept; check later keeps or releases it', async () => {
		const first = machine({ add: 'indeterminate' });
		const res: any = await first.svc.apply(mcp());

		expect(res).toMatchObject({ ok: false, unconfirmed: true, error: { stage: 'cli', category: 'timeout' }, connection: { appHash: 'hash-a1', unconfirmed: [ { appHash: 'hash-a1', keyFp: keyFingerprint(KEY_A), route: 'http', method: 'cli', targetPath: PROFILE } ] } });

		// The CLI did install it after all → kept
		first.env.writeFile(PROFILE, JSON.stringify({ mcpServers: { anytype: { type: 'http', url: 'http://127.0.0.1:31009/mcp/large', headers: { Authorization: `Bearer ${KEY_A}` } } } }), 0o600).close();
		await first.svc.check({ accountId: 'acc-a', apiListening: true, port: 31009, keys: keysOf([ 'hash-a1' ]) });
		expect(record(first.env)).toMatchObject({ appHash: 'hash-a1', revokePending: [], removed: false, observedInstalled: true });
		expect(record(first.env).unconfirmed).toBeUndefined();

		// A rotation whose CLI may still be running: an absent entry proves nothing, the candidate waits (U2)
		const rot = machine();

		await rot.svc.apply(mcp());

		const cli = rot.env.run;

		rot.env.run = async (file, args, opts) => (args[1] == 'add-json') ? { code: -1, stdout: '', timedOut: true, indeterminate: true } : cli(file, args, opts);
		expect(await rot.svc.apply(mcp({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }))).toMatchObject({ ok: false, unconfirmed: true });

		const waiting: any = await rot.svc.check({ accountId: 'acc-a', apiListening: true, port: 31009, keys: keysOf([ 'hash-a1', 'hash-a2' ]) });

		expect(waiting.connections[0].status).toBe('pending');
		expect(record(rot.env)).toMatchObject({ appHash: 'hash-a1', revokePending: [], unconfirmed: [ { appHash: 'hash-a2', running: true } ] });

		// Disconnect resolves it: every hash retired
		const removed: any = await rot.svc.remove({ accountId: 'acc-a', connectionId: 'claude-code', expectedHash: 'hash-a1' });

		expect(removed.connection.revokePending.sort()).toEqual([ 'hash-a1', 'hash-a2' ]);
	});

	test('U2: a check before a still-running CLI lands never retires its key; once it lands the check keeps it', async () => {
		const { env, svc } = machine();
		const cli = env.run;

		env.run = async (file, args, opts) => (args[1] == 'add-json') ? { code: -1, stdout: '', timedOut: true, indeterminate: true } : cli(file, args, opts);
		expect(await svc.apply(mcp())).toMatchObject({ ok: false, unconfirmed: true });

		expect((await svc.check({ accountId: 'acc-a', apiListening: true, port: 31009, keys: keysOf([ 'hash-a1' ]) }) as any).connections[0].status).toBe('pending');
		expect(record(env)).toMatchObject({ appHash: 'hash-a1', removed: false, revokePending: [] });

		// The CLI finishes afterwards
		env.writeFile(PROFILE, JSON.stringify({ mcpServers: { anytype: { type: 'http', url: 'http://127.0.0.1:31009/mcp/large', headers: { Authorization: `Bearer ${KEY_A}` } } } }), 0o600).close();
		expect((await svc.check({ accountId: 'acc-a', apiListening: true, port: 31009, keys: keysOf([ 'hash-a1' ]) }) as any).connections[0].status).toBe('ok');
		expect(record(env)).toMatchObject({ appHash: 'hash-a1', removed: false, revokePending: [], observedInstalled: true });
		expect(record(env).unconfirmed).toBeUndefined();
	});

	test('U2: a finished CLI whose readback was unreadable is retired once its own file shows it absent', async () => {
		const { env, svc } = machine({ add: 'failUnreadable' });

		expect(await svc.apply(mcp())).toMatchObject({ ok: false, unconfirmed: true, connection: { unconfirmed: [ { running: false } ] } });
		env.unlink(PROFILE);
		env.writeFile(PROFILE, '{}', 0o600).close();
		await svc.check({ accountId: 'acc-a', apiListening: true, port: 31009, keys: keysOf([ 'hash-a1' ]) });
		expect(record(env)).toMatchObject({ removed: true, revokePending: [ 'hash-a1' ] });
	});

	test('check never runs the CLI: ok, reconnect on a port change, conflict, unreadable, removed', async () => {
		const { env, svc } = machine();

		await svc.apply(mcp());
		env.calls.length = 0;

		const status = async (port = 31009) => (await svc.check({ accountId: 'acc-a', apiListening: true, port, keys: null }) as any).connections[0].status;

		expect(await status()).toBe('ok');
		expect(await status(31010)).toBe('reconnect');

		const doc = JSON.parse(env.readText(PROFILE));

		doc.mcpServers.anytype.headers.Authorization = `Bearer ${KEY_B}`;
		env.unlink(PROFILE);
		env.writeFile(PROFILE, JSON.stringify(doc), 0o600).close();
		expect(await status()).toBe('conflict');

		env.unlink(PROFILE);
		env.writeFile(PROFILE, '{ broken', 0o600).close();
		expect(await status()).toBe('unreadable');

		env.unlink(PROFILE);
		env.writeFile(PROFILE, '{}', 0o600).close();
		expect(await status()).toBe('removed');
		expect(cliCalls(env)).toEqual([]);
	});

	test('a legacy .config.json without .claude.json → manual (the CLI would use a file Anytype doesn\'t check)', async () => {
		const { env, svc } = machine({ files: { '/Users/me/.claude/.config.json': '{}' } });

		expect(await svc.plan(planParam({ appId: 'claude-code', route: 'http' }))).toMatchObject({ ok: true, canApply: false, error: { category: 'unsupportedForm' } });
		expect(await svc.apply(mcp())).toMatchObject({ ok: false, error: { category: 'unsupportedForm' } });
		expect(cliCalls(env)).toEqual([]);
	});

	test('update is unsupported on this route (the UI reconnects)', async () => {
		const { svc } = machine();

		await svc.apply(mcp());
		expect(await svc.update({ accountId: 'acc-a', connectionId: 'claude-code', expectedHash: 'hash-a1', port: 31010 })).toEqual({ ok: false, error: { stage: 'validate', category: 'unsupportedForm' } });
	});
});

describe('Claude Code: phase 2 review round 1', () => {
	const mcp = (over: Record<string, any> = {}) => cc({ route: 'http', ...over });
	const statusOf = async (svc: any, port = 31009) => (await svc.check({ accountId: 'acc-a', apiListening: true, port, keys: null }) as any).connections[0].status;
	const rewrite = (env: FakeEnv, file: string, text: string) => {
		env.unlink(file);
		env.writeFile(file, text, 0o600).close();
	};

	test('T3: CLAUDE_CONFIG_DIR moved: update refuses, check never heals or copies the key over, disconnect cleans the record\'s own profile', async () => {
		const A = '/Users/me/cc-a';
		const B = '/Users/me/cc-b';
		const { env, shell, svc, later } = machine({ dirs: [ A, B ], shell: { CLAUDE_CONFIG_DIR: A }, files: { [`${A}/settings.json`]: '{}', [`${B}/settings.json`]: '{}' } });

		expect(await svc.apply(cc())).toMatchObject({ ok: true, connection: { targetPath: `${A}/settings.json` } });

		shell.CLAUDE_CONFIG_DIR = B;
		later();

		expect(await svc.update({ accountId: 'acc-a', connectionId: 'claude-code', expectedHash: 'hash-a1', port: 31010 })).toMatchObject({ ok: false, error: { category: 'changed' } });
		expect(await statusOf(svc, 31010)).toBe('reconnect');
		expect(env.files()[`${B}/settings.json`]).toBe('{}');
		expect(env.files()[`${B}/skills/anytype-api/SKILL.md`]).toBeUndefined();
		expect(JSON.parse(env.files()[`${A}/settings.json`]).env).toEqual({ ANYTYPE_API_URL: 'http://127.0.0.1:31009', ANYTYPE_API_KEY: KEY_A });

		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'claude-code', expectedHash: 'hash-a1' })).toMatchObject({ ok: true });
		expect(JSON.parse(env.files()[`${A}/settings.json`]).env).toEqual({});
		expect(env.files()[`${A}/skills/anytype-api/SKILL.md`]).toBeUndefined();
		expect(env.files()[`${B}/settings.json`]).toBe('{}');
	});

	test('T3: the adapter itself refuses a heal or a refresh in another profile than the record\'s (check bound to the record)', async () => {
		const A = '/Users/me/cc-a';
		const { env, shell, svc, later } = machine({ dirs: [ A, '/Users/me/cc-b' ], shell: { CLAUDE_CONFIG_DIR: A }, files: { [`${A}/settings.json`]: '{}' } });

		await svc.apply(cc());

		const { claudeCode } = await import('./claudeCode');
		const { resolveHomes } = await import('../detect');
		const rec = record(env);

		shell.CLAUDE_CONFIG_DIR = '/Users/me/cc-b';
		later();

		const homes = await resolveHomes(env);

		expect(await claudeCode.check({ env, homes, detections: [], appId: 'claude-code', targetId: 'claude-code', port: 31010, tier: 'large', route: 'skill', key: '' }, rec)).toEqual({ status: 'reconnect', observedInstalled: true });
		expect(JSON.parse(env.files()[`${A}/settings.json`]).env.ANYTYPE_API_URL).toBe('http://127.0.0.1:31009');
	});

	test('T8: our bearer in an entry with another host or an extra field is not ours: foreign, conflict, untouched by disconnect', async () => {
		const { env, svc } = machine();

		await svc.apply(mcp());

		const original = env.readText(PROFILE);

		for (const edit of [ { url: 'http://evil.example:31009/mcp/large' }, { env: { NODE_OPTIONS: '--inspect' } } ]) {
			const doc = JSON.parse(original);

			Object.assign(doc.mcpServers.anytype, edit);
			rewrite(env, PROFILE, JSON.stringify(doc));

			expect(await svc.plan(planParam({ appId: 'claude-code', route: 'http' }))).toMatchObject({ ok: true, existing: 'foreign' });
			env.calls.length = 0;
			expect(await statusOf(svc)).toBe('conflict');
			expect(await svc.remove({ accountId: 'acc-a', connectionId: 'claude-code', expectedHash: 'hash-a1' })).toMatchObject({ ok: false, error: { category: 'conflict' } });
			expect(cliCalls(env).filter(c => c.args[0] == 'mcp')).toEqual([]);
			expect(env.readText(PROFILE)).toBe(JSON.stringify(doc));
		};
	});

	test('T11: a fresh Claude Code without ~/.claude: the plan holds and apply creates the profile; a profile too deep to create is manual in the plan', async () => {
		const fresh = machine({ noClaudeDir: true });

		expect(await fresh.svc.plan(planParam({ appId: 'claude-code', route: 'skill' }))).toMatchObject({ ok: true, canApply: true });
		expect(await fresh.svc.apply(cc())).toMatchObject({ ok: true, connection: { createdDirs: expect.arrayContaining([ '/Users/me/.claude', '/Users/me/.claude/skills' ]) } });
		expect(fresh.env.files()[SKILL]).toBe(BUILT);
		expect(JSON.parse(fresh.env.files()[SETTINGS]).env.ANYTYPE_API_KEY).toBe(KEY_A);

		const deep = machine({ shell: { CLAUDE_CONFIG_DIR: '/Users/me/a/b' } });

		expect(await deep.svc.plan(planParam({ appId: 'claude-code', route: 'skill' }))).toMatchObject({ ok: true, canApply: false, error: { stage: 'write', category: 'notFound' } });
	});

	test('T19: skill cleanup never follows a link out of the profile: a linked skills directory is left alone and reported', async () => {
		const first = machine({ files: { [SETTINGS]: '{}' } });

		await first.svc.apply(cc());

		const outside = '/opt/elsewhere/skills/anytype-api/SKILL.md';
		const files = Object.fromEntries(Object.entries(first.env.files()).filter(([ p ]) => !p.startsWith('/Users/me/.claude/skills/')));
		const { env, svc } = machine({ files: { ...files, [outside]: BUILT }, links: { '/Users/me/.claude/skills': '/opt/elsewhere/skills' } });

		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'claude-code', expectedHash: 'hash-a1' })).toMatchObject({ ok: true, connection: { left: 'entry' } });
		expect(env.files()[outside]).toBe(BUILT);
		expect(JSON.parse(env.files()[SETTINGS]).env).toEqual({});
	});

	test('T20: the CLI gets the canonical CLAUDE_CONFIG_DIR that was checked; a link swapped before the add stops the delivery', async () => {
		const linked = machine({ dirs: [ '/Users/me/cc-real' ], links: { '/Users/me/cc-link': '/Users/me/cc-real' }, shell: { CLAUDE_CONFIG_DIR: '/Users/me/cc-link' } });

		expect(await linked.svc.apply(mcp())).toMatchObject({ ok: true, connection: { targetPath: '/Users/me/cc-real/.claude.json' } });
		expect(cliCalls(linked.env).every(c => c.opts.env.CLAUDE_CONFIG_DIR == '/Users/me/cc-real')).toBe(true);

		const swapped = machine({ dirs: [ '/Users/me/cc-real', '/Users/me/cc-other' ], links: { '/Users/me/cc-link': '/Users/me/cc-real' }, shell: { CLAUDE_CONFIG_DIR: '/Users/me/cc-link' } });
		const run = swapped.env.run;
		const realpath = swapped.env.realpath;
		let moved = false;

		swapped.env.run = async (file, args, opts) => {
			const res = await run(file, args, opts);

			if (args[0] == '--version') {
				moved = true;
			};
			return res;
		};
		swapped.env.realpath = p => (moved && p.startsWith('/Users/me/cc-link')) ? p.replace('/Users/me/cc-link', '/Users/me/cc-other') : realpath(p);

		expect(await swapped.svc.apply(mcp())).toEqual({ ok: false, error: { stage: 'write', category: 'changed' } });
		expect(cliCalls(swapped.env).filter(c => c.args[1] == 'add-json')).toEqual([]);
	});

	test('T21: a key in a settings file others can write is not reused for a heal or an update', async () => {
		const { env, svc } = machine({ files: { [SETTINGS]: '{}' } });

		await svc.apply(cc());
		env.chmod(SETTINGS, 0o666);

		const bytes = env.files()[SETTINGS];

		expect(await statusOf(svc, 31010)).toBe('reconnect');
		expect(await svc.update({ accountId: 'acc-a', connectionId: 'claude-code', expectedHash: 'hash-a1', port: 31010 })).toMatchObject({ ok: false, error: { category: 'permission' } });
		expect(env.files()[SETTINGS]).toBe(bytes);
	});

	test('T4: settings env values deleted during a heal are not put back', async () => {
		const { env, svc } = machine({ files: { [SETTINGS]: '{}' } });

		await svc.apply(cc());

		const chmod = env.chmod;

		env.chmod = (p, mode) => {
			chmod(p, mode);
			if (p.includes('.settings.json.new-') && JSON.parse(env.readText(SETTINGS)).env) {
				rewrite(env, SETTINGS, '{}');
			};
		};
		expect(await statusOf(svc, 31010)).toBe('removed');
		expect(env.files()[SETTINGS]).toBe('{}');
	});

	test('T24: skill → MCP tools removes the skill route\'s artefacts; MCP tools → skill removes the CLI entry', async () => {
		const { env, svc } = machine({ files: { [SETTINGS]: '{}' } });

		await svc.apply(cc());
		expect(await svc.apply(mcp({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }))).toMatchObject({ ok: true, connection: { route: 'http', targetPath: PROFILE, revokePending: [ 'hash-a1' ] } });
		expect(JSON.parse(env.files()[SETTINGS])).toEqual({ env: {} });
		expect(env.files()[SKILL]).toBeUndefined();
		expect(record(env).prior).toBeUndefined();

		expect(await svc.apply(cc({ key: KEY_C, appHash: 'hash-a3', expectedHash: 'hash-a2' }))).toMatchObject({ ok: true, connection: { route: 'skill' } });
		expect(JSON.parse(env.files()[PROFILE]).mcpServers.anytype).toBeUndefined();
		expect(env.files()[SKILL]).toBe(BUILT);
	});

	test('T24: a switch whose cleanup can\'t finish keeps `prior`; disconnect removes it later', async () => {
		const { env, svc } = machine({ files: { [SETTINGS]: '{}' } });

		await svc.apply(cc());

		const owned = env.readText(SETTINGS);

		rewrite(env, SETTINGS, '{ broken');
		expect(await svc.apply(mcp({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }))).toMatchObject({ ok: true, connection: { route: 'http', prior: { route: 'skill', targetPath: SETTINGS, keyFp: keyFingerprint(KEY_A) } } });

		rewrite(env, SETTINGS, owned);
		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'claude-code', expectedHash: 'hash-a2' })).toMatchObject({ ok: true });
		expect(JSON.parse(env.files()[SETTINGS]).env).toEqual({});
		expect(env.files()[SKILL]).toBeUndefined();
		expect(record(env).prior).toBeUndefined();
	});
});

describe('Claude Code: phase 2 review round 2', () => {
	const mcp = (over: Record<string, any> = {}) => cc({ route: 'http', ...over });
	const statusOf = async (svc: any, port = 31009, keys: any = null) => (await svc.check({ accountId: 'acc-a', apiListening: true, port, keys }) as any).connections[0].status;
	const rewrite = (env: FakeEnv, file: string, text: string) => {
		if (env.exists(file)) {
			env.unlink(file);
		};
		env.writeFile(file, text, 0o600).close();
	};
	const entryFor = (key: string, url = 'http://127.0.0.1:31009/mcp/large') => ({ type: 'http', url, headers: { Authorization: `Bearer ${key}` } });
	const indeterminateAdd = (env: FakeEnv) => {
		const cli = env.run;

		env.run = async (file, args, opts) => (args[1] == 'add-json') ? { code: -1, stdout: '', timedOut: true, indeterminate: true } : cli(file, args, opts);
		return () => {
			env.run = cli;
		};
	};

	test('U5: the user\'s own SKILL.md: the conflict plan offers no step that would replace it', async () => {
		const { svc } = machine({ files: { [SKILL]: '---\nname: anytype-api\n---\nmine\n', [SETTINGS]: '{}' } });

		expect(await svc.plan(planParam({ appId: 'claude-code', route: 'skill' }))).toMatchObject({ ok: true, canApply: false, error: { category: 'conflict' }, note: 'aiConnectSkillConflict', steps: [] });
	});

	test('U5 / U22: a SKILL.md the user writes between the ownership read and the write is never overwritten', async () => {
		const old = '<!-- anytype-desktop:begin -->old<!-- anytype-desktop:end -->';
		const { env, svc } = machine({ files: { [SKILL]: old, [SETTINGS]: '{}' } });
		const chmod = env.chmod;

		env.chmod = (p, mode) => {
			chmod(p, mode);
			if (p.includes('.SKILL.md.new-') && (env.readText(SKILL) == old)) {
				rewrite(env, SKILL, 'mine');
			};
		};
		expect(await svc.apply(cc())).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(env.files()[SKILL]).toBe('mine');
		expect(env.files()[SETTINGS]).toBe('{}');
	});

	test('U5: an ANYTYPE_API_URL of the user\'s (without a key) is someone\'s: foreign in the plan, never overwritten without Replace', async () => {
		const settings = JSON.stringify({ env: { ANYTYPE_API_URL: 'http://127.0.0.1:4000' } });
		const { env, svc } = machine({ files: { [SETTINGS]: settings } });

		expect(await svc.plan(planParam({ appId: 'claude-code', route: 'skill' }))).toMatchObject({ ok: true, existing: 'foreign', replace: { targetPath: SETTINGS } });
		expect(await svc.apply(cc())).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(env.files()[SETTINGS]).toBe(settings);
	});

	test('U5 (R2-14): the skill replaced by the user\'s own file is not a healthy connection', async () => {
		const { env, svc } = machine({ files: { [SETTINGS]: '{}' } });

		await svc.apply(cc());
		rewrite(env, SKILL, '---\nname: anytype-api\n---\nmine\n');
		expect(await statusOf(svc)).toBe('conflict');
		expect(env.files()[SKILL]).toBe('---\nname: anytype-api\n---\nmine\n');
	});

	test('U6: a settings.json linked out of the profile (dotfiles) is manual: the skill never lands next to the link\'s target', async () => {
		const { env, svc } = machine({ files: { '/Users/me/dotfiles/settings.json': '{}' }, links: { [SETTINGS]: '/Users/me/dotfiles/settings.json' } });

		expect(await svc.plan(planParam({ appId: 'claude-code', route: 'skill' }))).toMatchObject({ ok: true, canApply: false, error: { stage: 'read', category: 'unsupportedForm' } });
		expect(await svc.apply(cc())).toMatchObject({ ok: false, error: { category: 'unsupportedForm' } });
		expect(Object.keys(env.files()).filter(p => p.includes('/skills/'))).toEqual([]);
		expect(env.files()['/Users/me/dotfiles/settings.json']).toBe('{}');
	});

	test('U6: the record\'s profile directory replaced by a link to another profile: disconnect touches nothing there', async () => {
		const A = '/Users/me/cc-a';
		const B = '/Users/me/cc-b';
		const first = machine({ dirs: [ A ], shell: { CLAUDE_CONFIG_DIR: A }, files: { [`${A}/settings.json`]: '{}' } });

		await first.svc.apply(cc());

		const settings = first.env.files()[`${A}/settings.json`];
		const files = Object.fromEntries(Object.entries(first.env.files()).filter(([ p ]) => !p.startsWith(`${A}/`)));
		const { env, svc } = machine({ files: { ...files, [`${B}/settings.json`]: settings, [`${B}/skills/anytype-api/SKILL.md`]: BUILT }, links: { [A]: B }, shell: { CLAUDE_CONFIG_DIR: A } });

		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'claude-code', expectedHash: 'hash-a1' })).toMatchObject({ ok: true, connection: { left: 'entry' } });
		expect(env.files()[`${B}/skills/anytype-api/SKILL.md`]).toBe(BUILT);
		expect(env.files()[`${B}/settings.json`]).toBe(settings);
	});

	test('U7: an entry changed (another URL) right after the add is never health-checked: no `mcp get`, not observed', async () => {
		const { env, svc } = machine();
		const cli = env.run;

		env.run = async (file, args, opts) => {
			const res = await cli(file, args, opts);

			if (args[1] == 'add-json') {
				rewrite(env, PROFILE, JSON.stringify({ mcpServers: { anytype: entryFor(KEY_A, 'http://evil.example:31009/mcp/large') } }));
			};
			return res;
		};
		expect(await svc.apply(mcp())).toMatchObject({ ok: true, connection: { observedInstalled: false } });
		expect(cliCalls(env).map(c => c.args[1] || c.args[0])).toEqual([ '--version', 'add-json' ]);
		expect(await statusOf(svc)).toBe('conflict');
	});

	test('U9: a manual Claude Code connection switched to automatic leaves a valid, saved record', async () => {
		const { env, svc } = machine({ files: { [SETTINGS]: '{}' } });
		const { key: _k, ...manual } = cc({ appHash: 'hash-m1' });

		expect(await svc.recordManual(manual)).toMatchObject({ ok: true, connection: { id: 'claude-code', method: 'manual' } });

		const res: any = await svc.apply(cc({ appHash: 'hash-a1', expectedHash: 'hash-m1' }));

		expect(res).toMatchObject({ ok: true, connection: { method: 'config', route: 'skill', revokePending: [ 'hash-m1' ] } });
		expect(res.recordSaved).toBeUndefined();
		expect(((await service(env).list({ accountId: 'acc-a' })) as any).connections[0]).toMatchObject({ appHash: 'hash-a1', method: 'config' });
		expect(record(env).prior).toBeUndefined();
	});

	test('U10: a late rotation in a moved profile settles against its own file; disconnect cleans both profiles through the CLI', async () => {
		const A = '/Users/me/cc-a';
		const B = '/Users/me/cc-b';
		const { env, shell, svc, later } = machine({ dirs: [ A, B ], shell: { CLAUDE_CONFIG_DIR: A } });

		await svc.apply(mcp());
		shell.CLAUDE_CONFIG_DIR = B;
		later();

		const restore = indeterminateAdd(env);

		expect(await svc.apply(mcp({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }))).toMatchObject({ ok: false, unconfirmed: true, connection: { unconfirmed: [ { targetPath: `${B}/.claude.json`, running: true } ] } });
		restore();

		// The CLI's write lands in B
		rewrite(env, `${B}/.claude.json`, JSON.stringify({ mcpServers: { anytype: entryFor(KEY_B) } }));
		expect(await statusOf(svc, 31009, keysOf([ 'hash-a1', 'hash-a2' ]))).toBe('ok');
		expect(record(env)).toMatchObject({ appHash: 'hash-a2', targetPath: `${B}/.claude.json`, revokePending: [ 'hash-a1' ], prior: { route: 'http', targetPath: `${A}/.claude.json` } });

		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'claude-code', expectedHash: 'hash-a2' })).toMatchObject({ ok: true });
		expect(JSON.parse(env.files()[`${A}/.claude.json`]).mcpServers.anytype).toBeUndefined();
		expect(JSON.parse(env.files()[`${B}/.claude.json`]).mcpServers.anytype).toBeUndefined();
		expect(cliCalls(env).filter(c => c.args[1] == 'remove').map(c => c.opts.env.CLAUDE_CONFIG_DIR)).toEqual([ B, A ]);
	});

	test('U10: MCP tools in profile A, then the skill in profile B: A\'s entry is removed through the CLI pointed at A (nothing forgotten)', async () => {
		const A = '/Users/me/cc-a';
		const B = '/Users/me/cc-b';
		const { env, shell, svc, later } = machine({ dirs: [ A, B ], shell: { CLAUDE_CONFIG_DIR: A }, files: { [`${B}/settings.json`]: '{}' } });

		await svc.apply(mcp());
		shell.CLAUDE_CONFIG_DIR = B;
		later();

		expect(await svc.apply(cc({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }))).toMatchObject({ ok: true, connection: { route: 'skill', targetPath: `${B}/settings.json` } });
		expect(JSON.parse(env.files()[`${A}/.claude.json`]).mcpServers.anytype).toBeUndefined();
		expect(record(env).prior).toBeUndefined();
	});

	test('U10: a finished delivery into a moved profile that left nothing is retired after its own file was read', async () => {
		const A = '/Users/me/cc-a';
		const B = '/Users/me/cc-b';
		const { env, shell, svc, later } = machine({ dirs: [ A, B ], shell: { CLAUDE_CONFIG_DIR: A } });

		await svc.apply(mcp());
		shell.CLAUDE_CONFIG_DIR = B;
		later();

		const cli = env.run;

		env.run = async (file, args, opts) => {
			if (args[1] == 'add-json') {
				rewrite(env, `${B}/.claude.json`, '{ half');
				return { code: 1, stdout: '' };
			};
			return cli(file, args, opts);
		};
		expect(await svc.apply(mcp({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }))).toMatchObject({ ok: false, unconfirmed: true, connection: { unconfirmed: [ { running: false } ] } });
		env.run = cli;
		rewrite(env, `${B}/.claude.json`, '{}');

		await svc.check({ accountId: 'acc-a', apiListening: true, port: 31009, keys: keysOf([ 'hash-a1', 'hash-a2' ]) });
		expect(record(env)).toMatchObject({ appHash: 'hash-a1', revokePending: [ 'hash-a2' ], targetPath: `${A}/.claude.json` });
		expect(record(env).unconfirmed).toBeUndefined();
	});

	test('U11: a promoted candidate brings its own grant, expiry and name (the ListApps row of the new key wins)', async () => {
		const { env, svc } = machine();

		await svc.apply(mcp());

		const restore = indeterminateAdd(env);
		const grant = { spaceIds: [ 'space-1' ], allSpaces: false, perm: 0 };

		await svc.apply(mcp({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1', grant, expireAt: 1900000000, name: 'Claude Code (work)' }));
		restore();
		rewrite(env, PROFILE, JSON.stringify({ mcpServers: { anytype: entryFor(KEY_B) } }));

		await svc.check({ accountId: 'acc-a', apiListening: true, port: 31009, keys: [ { hash: 'hash-a1', present: true }, { hash: 'hash-a2', present: true, grant, expireAt: 1900000500 } ] });
		expect(record(env)).toMatchObject({ appHash: 'hash-a2', grant, expireAt: 1900000500, name: 'Claude Code (work)', lastProbe: 'none' });
	});

	test('U17: a SKILL.md that is a directory is refused in the plan, before any key', async () => {
		const { svc } = machine({ files: { [SETTINGS]: '{}' }, dirs: [ SKILL ] });

		expect(await svc.plan(planParam({ appId: 'claude-code', route: 'skill' }))).toMatchObject({ ok: true, canApply: false });
	});

	test('U18: a failed same-key redelivery (skill connection → MCP tools, same key) never retires the working key', async () => {
		const { env, svc } = machine({ files: { [SETTINGS]: '{}' } });

		await svc.apply(cc());

		const cli = env.run;

		env.run = async (file, args, opts) => {
			if (args[1] == 'add-json') {
				rewrite(env, PROFILE, '{ half');
				return { code: 1, stdout: '' };
			};
			return cli(file, args, opts);
		};
		expect(await svc.apply(mcp({ expectedHash: 'hash-a1' }))).toMatchObject({ ok: false, unconfirmed: true });
		env.run = cli;
		rewrite(env, PROFILE, '{}');

		await svc.check({ accountId: 'acc-a', apiListening: true, port: 31009, keys: keysOf([ 'hash-a1' ]) });
		expect(record(env)).toMatchObject({ appHash: 'hash-a1', route: 'skill', removed: false, revokePending: [] });
		expect(JSON.parse(env.files()[SETTINGS]).env.ANYTYPE_API_KEY).toBe(KEY_A);
	});
});

describe('Claude Code: phase 2 final round', () => {
	const mcp = (over: Record<string, any> = {}) => cc({ route: 'http', ...over });
	const land = (env: FakeEnv, key: string) => {
		if (env.exists(PROFILE)) {
			env.unlink(PROFILE);
		};
		env.writeFile(PROFILE, JSON.stringify({ mcpServers: { anytype: { type: 'http', url: 'http://127.0.0.1:31009/mcp/large', headers: { Authorization: `Bearer ${key}` } } } }), 0o600).close();
	};
	const stuck = (env: FakeEnv) => {
		const cli = env.run;

		env.run = async (file, args, opts) => (args[1] == 'add-json') ? { code: -1, stdout: '', timedOut: true, indeterminate: true } : cli(file, args, opts);
		return () => {
			env.run = cli;
		};
	};

	test('final 2: promoting one of two still-running candidates never revokes the other (it may land last)', async () => {
		const { env, svc } = machine();

		await svc.apply(mcp());

		const restore = stuck(env);

		await svc.apply(mcp({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }));
		await svc.apply(mcp({ key: KEY_C, appHash: 'hash-a3', expectedHash: 'hash-a1' }));
		restore();
		land(env, KEY_B);

		await svc.check({ accountId: 'acc-a', apiListening: true, port: 31009, keys: keysOf([ 'hash-a1', 'hash-a2', 'hash-a3' ]) });
		expect(record(env)).toMatchObject({ appHash: 'hash-a2', revokePending: [ 'hash-a1' ], unconfirmed: [ { appHash: 'hash-a3', running: true } ] });

		// The other CLI lands last: its key is the installed one, and it is still alive to be kept
		land(env, KEY_C);
		await svc.check({ accountId: 'acc-a', apiListening: true, port: 31009, keys: keysOf([ 'hash-a1', 'hash-a2', 'hash-a3' ]) });
		expect(record(env)).toMatchObject({ appHash: 'hash-a3', keyFp: keyFingerprint(KEY_C) });
		expect(record(env).revokePending.sort()).toEqual([ 'hash-a1', 'hash-a2' ]);
	});

	test('final 5: the preview showed the skill\'s settings.json, but the effective route became MCP tools (sandbox on): changed, nothing written or run', async () => {
		const { env, svc } = machine({ files: { [SETTINGS]: '{}' } });
		const plan: any = await svc.plan(planParam({ appId: 'claude-code', route: 'skill' }));

		expect(plan.targetPath).toBe(SETTINGS);
		env.unlink(SETTINGS);
		env.writeFile(SETTINGS, JSON.stringify({ sandbox: { enabled: true } }), 0o600).close();
		env.calls.length = 0;

		expect(await svc.apply(cc({ previewTarget: plan.targetPath }))).toEqual({ ok: false, error: { stage: 'write', category: 'changed' } });
		expect(cliCalls(env).filter(c => c.args[0] == 'mcp')).toEqual([]);
		expect(env.files()[PROFILE]).toBeUndefined();
		expect(env.files()[SKILL]).toBeUndefined();
	});

	test('final 6: a manual connection whose automatic CLI delivery lands later adopts the installed key (no `prior` for the manual setup)', async () => {
		const { env, svc } = machine();
		const { key: _k, ...manual } = mcp({ appHash: 'hash-m1' });

		await svc.recordManual(manual);

		const restore = stuck(env);

		expect(await svc.apply(mcp({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-m1' }))).toMatchObject({ ok: false, unconfirmed: true });
		restore();
		land(env, KEY_B);

		expect((await svc.check({ accountId: 'acc-a', apiListening: true, port: 31009, keys: keysOf([ 'hash-m1', 'hash-a2' ]) }) as any).connections[0].status).toBe('ok');
		expect(record(env)).toMatchObject({ appHash: 'hash-a2', method: 'cli', route: 'http', targetPath: PROFILE, revokePending: [ 'hash-m1' ] });
		expect(record(env).prior).toBeUndefined();
	});
});
