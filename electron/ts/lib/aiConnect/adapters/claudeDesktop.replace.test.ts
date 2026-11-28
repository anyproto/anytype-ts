/**
 * Claude Desktop, main side: the extension replacing the Anytype entry in Claude's settings file (with the user's
 * Replace, bound to the entry's digest), the key on the clipboard as main reports it (`keyCopied`), and the error a
 * build without a usable bundle gives (`bundleMissing`, never the Linux package's `unsupportedPackage`).
 * Every file is in the fake file system; nothing here reads the real home.
 */
import { describe, expect, test, vi } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: () => '/nonexistent', getAppPath: () => '/nonexistent', getVersion: () => '0.0.0', getFileIcon: vi.fn(), getApplicationInfoForProtocol: vi.fn() }, shell: { openExternal: vi.fn(), showItemInFolder: vi.fn() }, clipboard: { readText: vi.fn(), writeText: vi.fn() } }));
vi.mock('electron-util', () => ({ fixPathForAsarUnpack: (p: string) => p }));

import { FORWARDER_FILES, KEY_A, KEY_B, MCP_DIR, REGISTRY, applyParam, mac, planParam, service } from '../testKit';
import { CLIPBOARD_TTL_MS } from '../clipboard';
import { canonicalDigest } from '../digest';
import { serveCommand } from '../forwarder';
import type { FakeEnv } from '../testEnv';
import type { AiRecord } from '../types';

const DIR = '/Users/me/Library/Application Support/Claude';
const CONFIG = `${DIR}/claude_desktop_config.json`;
const APP = '/Applications/Claude.app';
const EXE = `${APP}/Contents/MacOS/Claude`;
const ARCHIVE = 'mcpb-archive-bytes';
const FOREIGN_KEY = 'SENTINEL-foreign-key-0123456789abcdef';
/** Someone's own Anytype entry (it holds a key), next to another server and Claude's own settings */
const FOREIGN = { command: '/opt/anytype-mcp', args: [ 'serve', '--tier', 'small' ], env: { ANYTYPE_API_KEY: FOREIGN_KEY } };
const OTHER_TEXT = '"other": { "command": "o",   "args": [ "x" ] }';
const CONFIG_TEXT = `{\n  "globalShortcut": "Alt+Space",\n  "mcpServers": {\n    ${OTHER_TEXT},\n    "anytype": ${JSON.stringify(FOREIGN)}\n  },\n  "preferences": { "menuBar": true }\n}\n`;

interface Opt {
	signed?: boolean;
	files?: Record<string, string>;
	running?: boolean | 'unknown';
	/** No bundle and no forwarder in this build (a development build without ./update.sh) */
	bare?: boolean;
	/** The forwarder ships, the bundle doesn't */
	noBundle?: boolean;
	links?: Record<string, string>;
	/** The build's metadata text (default: computed from the files) */
	meta?: string | null;
	/** `open -a Claude` without a bundle (starting Claude again) fails */
	relaunchFails?: boolean;
};

/** A Mac with Claude Desktop: processes, the quit and every `open` recorded */
const machine = (opt: Opt = {}) => {
	const state = { running: opt.running ?? false, killed: [] as number[], opened: [] as string[][] };
	const files: Record<string, string> = {
		...(opt.bare ? {} : FORWARDER_FILES),
		...((opt.bare || opt.noBundle) ? {} : { [`${MCP_DIR}/Anytype.mcpb`]: ARCHIVE }),
		...(opt.files || {}),
	};
	const env = mac({
		apps: [ 'Claude' ], dirs: [ DIR ], signed: opt.signed, files, links: opt.links, ...((opt.meta !== undefined) ? { meta: opt.meta } : {}),
		run: call => {
			if (call.file == '/usr/bin/open') {
				state.opened.push(call.args);
				if (opt.relaunchFails && (call.args.length == 2)) {
					return { code: 1, stdout: '' };
				};
				// `open -a Claude …` starts Claude, with or without a bundle
				state.running = true;
				return { code: 0, stdout: '' };
			};
			return null;
		},
	});

	env.listProcesses = async () => (state.running == 'unknown') ? null : (state.running ? [ { pid: 42, ppid: 1, exe: EXE, cmd: '' } ] : []);
	env.kill = (pid: number) => {
		state.killed.push(pid);
		state.running = false;
		return true;
	};
	return { env, state, svc: service(env) };
};

const records = (env: FakeEnv): AiRecord[] => JSON.parse(env.readText(REGISTRY) || '{"connections":[]}').connections;
const registry = (env: FakeEnv): any => JSON.parse(env.readText(REGISTRY) || '{}');
const planOf = (svc: any, over: Record<string, any> = {}) => svc.plan(planParam({ appId: 'claude-desktop', route: 'stdio', tier: 'full', method: 'package', ...over }));
const bundle = (over: Record<string, any> = {}) => applyParam({ appId: 'claude-desktop', route: 'stdio', name: 'Claude Desktop', method: 'package', tier: 'full', recommendedTier: 'full', ...over });
const config = (over: Record<string, any> = {}) => applyParam({ appId: 'claude-desktop', route: 'stdio', name: 'Claude Desktop', method: 'config', ...over });
const consentFor = (value: any) => ({ targetPath: CONFIG, foreignDigest: canonicalDigest(value) });
const copies = (env: FakeEnv): string[] => Object.keys(env.files()).filter(f => f.endsWith('.mcpb') && !f.startsWith(MCP_DIR));
/** Everything in Claude's folder and Anytype's home folder besides the config itself: backups, temps */
const leftovers = (env: FakeEnv): string[] => Object.keys(env.files()).filter(f => (f.startsWith(`${DIR}/`) && (f != CONFIG)) || /\.(tmp|bak|backup)$/.test(f) || f.includes('anytype-backup'));
const put = (env: FakeEnv, file: string, text: string) => {
	if (env.exists(file)) {
		env.unlink(file);
	};
	env.writeFile(file, text, 0o600).close();
};

describe('Claude Desktop: the extension replaces the settings-file entry, with Replace', () => {
	test('replace-plan: a foreign entry → the plan stays applicable and asks for Replace, bound to the entry\'s digest; the entry\'s args and env are never in it', async () => {
		const { env, svc } = machine({ files: { [CONFIG]: CONFIG_TEXT } });
		const res: any = await planOf(svc);

		expect(res).toMatchObject({
			ok: true, canApply: true, method: 'package', tier: 'full', existing: 'foreign', note: 'aiConnectClaudeReplaceConfig',
			replace: { targetPath: CONFIG, foreignDigest: canonicalDigest(FOREIGN) },
		});
		expect(res.preflight).toBeUndefined();
		expect(JSON.stringify(res)).not.toContain(FOREIGN_KEY);
		expect(JSON.stringify(res)).not.toContain('/opt/anytype-mcp');
		// A plan changes nothing
		expect(env.files()[CONFIG]).toBe(CONFIG_TEXT);
	});

	test('replace-refused: apply without the consent, or with a stale digest or another file, is refused (`conflict`) and leaves the file byte-identical; no record, nothing copied or opened', async () => {
		const { env, state, svc } = machine({ files: { [CONFIG]: CONFIG_TEXT } });

		// No consent, a consent for another entry (conflict), a consent for another file (changed: a fresh preview first)
		const cases: [ any, string ][] = [ [ undefined, 'conflict' ], [ consentFor({ ...FOREIGN, args: [ 'serve' ] }), 'conflict' ], [ { ...consentFor(FOREIGN), targetPath: `${DIR}/other.json` }, 'changed' ] ];

		for (const [ replace, category ] of cases) {
			expect(await svc.apply(bundle(replace ? { replace } : {}))).toMatchObject({ ok: false, error: { category } });
		};
		expect(env.files()[CONFIG]).toBe(CONFIG_TEXT);
		expect(records(env)).toEqual([]);
		expect(env.clip.writes).toEqual([]);
		expect(state.opened).toEqual([]);
	});

	test('replace-stale: the entry edited after the plan (the consent names the old one) → `conflict`, the file as it is', async () => {
		const { env, svc } = machine({ files: { [CONFIG]: CONFIG_TEXT } });
		const shown: any = await planOf(svc);
		const edited = CONFIG_TEXT.replace(FOREIGN_KEY, 'SENTINEL-edited-key-0123456789abcdef');

		put(env, CONFIG, edited);
		expect(await svc.apply(bundle({ replace: shown.replace }))).toMatchObject({ ok: false, error: { stage: 'validate', category: 'conflict' } });
		expect(env.files()[CONFIG]).toBe(edited);
		expect(records(env)).toEqual([]);
	});

	test('replace-apply: with the consent only `mcpServers.anytype` goes (the other server and Claude\'s settings byte for byte), as a secret write; the record is saved first, the entry removed before the key is copied, then the bundle opened', async () => {
		const { env, state, svc } = machine({ files: { [CONFIG]: CONFIG_TEXT } });
		const shown: any = await planOf(svc);
		const order: string[] = [];
		const write = env.clipboardWrite;

		env.clipboardWrite = text => {
			order.push(`copy:${records(env).length}:${env.files()[CONFIG].includes('"anytype"') ? 'entry' : 'gone'}:${state.opened.length}`);
			write(text);
		};

		const res: any = await svc.apply(bundle({ replace: shown.replace }));
		const after = env.files()[CONFIG];

		expect(res).toMatchObject({ ok: true, connection: { method: 'package', status: 'pending', bundleState: 'finish', keyCopied: true } });
		expect(order).toEqual([ 'copy:1:gone:0' ]);
		expect(state.opened).toEqual([ [ '-a', APP, copies(env)[0] ] ]);
		expect(JSON.parse(after)).toEqual({ globalShortcut: 'Alt+Space', mcpServers: { other: { command: 'o', args: [ 'x' ] } }, preferences: { menuBar: true } });
		expect(after).toContain(OTHER_TEXT);
		expect(after).toContain('"preferences": { "menuBar": true }');
		expect(env.modeOf(CONFIG)).toBe(0o600);
		// No backup or temp keeps the replaced entry's key; the new key is only on the clipboard
		expect(JSON.stringify(env.files())).not.toContain(FOREIGN_KEY);
		expect(JSON.stringify(env.files())).not.toContain(KEY_A);
		expect(leftovers(env).filter(f => !f.includes('Claude Extensions'))).toEqual([]);
		expect(records(env)).toHaveLength(1);
		expect(records(env)[0].entryDigest).toBeUndefined();
	});

	test('replace-gone: the entry the user agreed to replace removed meanwhile → nothing left to replace, the extension goes on', async () => {
		const { env, state, svc } = machine({ files: { [CONFIG]: CONFIG_TEXT } });
		const shown: any = await planOf(svc);

		put(env, CONFIG, '{"mcpServers":{}}');
		expect(await svc.apply(bundle({ replace: shown.replace }))).toMatchObject({ ok: true });
		expect(env.files()[CONFIG]).toBe('{"mcpServers":{}}');
		expect(state.opened).toHaveLength(1);
	});

	test('replace-undo: the entry changes between the commit and its removal → the commit is undone (no record, the key\'s mint intent back), nothing copied or opened, the file as the user left it', async () => {
		const { env, state, svc } = machine({ files: { [CONFIG]: CONFIG_TEXT } });
		const shown: any = await planOf(svc);
		const intent: any = await svc.mintIntent({ accountId: 'acc-a', name: 'Claude Desktop', time: 1 });
		const edited = CONFIG_TEXT.replace(FOREIGN_KEY, 'SENTINEL-edited-key-0123456789abcdef');
		const list = env.listProcesses;

		// The first process lookup after the record's save is the removal's: the user edits the entry right then
		env.listProcesses = async () => {
			if (records(env).length && (env.files()[CONFIG] != edited)) {
				put(env, CONFIG, edited);
			};
			return list();
		};

		expect(await svc.apply(bundle({ replace: shown.replace, intentId: intent.id }))).toMatchObject({ ok: false, error: { stage: 'validate', category: 'conflict' } });
		expect(records(env)).toEqual([]);
		expect(registry(env).mintIntents).toEqual([ expect.objectContaining({ id: intent.id, accountId: 'acc-a', name: 'Claude Desktop' }) ]);
		expect(env.files()[CONFIG]).toBe(edited);
		expect(env.clip.writes).toEqual([]);
		expect(state.opened).toEqual([]);
	});

	test('replace-undo: a previous record comes back exactly as it was', async () => {
		const { env, svc } = machine({ files: { [CONFIG]: '{}' } });

		expect(await svc.apply(config())).toMatchObject({ ok: true });

		const before = records(env)[0];
		const shown: any = await planOf(svc);
		const list = env.listProcesses;

		env.listProcesses = async () => {
			if (records(env)[0]?.method == 'package') {
				put(env, CONFIG, JSON.stringify({ mcpServers: { anytype: FOREIGN } }));
			};
			return list();
		};

		expect(await svc.apply(bundle({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1', replace: shown.replace }))).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(records(env)).toEqual([ before ]);
	});

	test('replace-own: an entry this account set up on the settings-file route → the same Replace; connecting through the extension keeps one record and queues the old key for revocation', async () => {
		const { env, svc } = machine({ files: { [CONFIG]: '{}' } });

		expect(await svc.apply(config())).toMatchObject({ ok: true, connection: { method: 'config', appHash: 'hash-a1' } });

		const shown: any = await planOf(svc);

		expect(shown).toMatchObject({ canApply: true, existing: 'ours', replace: { targetPath: CONFIG, foreignDigest: canonicalDigest(serveCommand(env, { tier: 'large', key: KEY_A })) } });

		// Without the Replace it is refused like any other entry
		expect(await svc.apply(bundle({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1' }))).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(records(env)[0]).toMatchObject({ method: 'config', appHash: 'hash-a1', revokePending: [] });

		const res: any = await svc.apply(bundle({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1', replace: shown.replace }));

		expect(res).toMatchObject({ ok: true, connection: { id: 'claude-desktop', method: 'package', appHash: 'hash-a2', revokePending: [ 'hash-a1' ] } });
		expect(records(env)).toHaveLength(1);
		expect(records(env)[0].entryDigest).toBeUndefined();
		expect(records(env)[0].configPath).toBeUndefined();
		expect(JSON.parse(env.files()[CONFIG]).mcpServers?.anytype).toBeUndefined();
		expect(JSON.stringify(env.files())).not.toContain(KEY_A);

		// The renderer revokes it; then nothing of the old connection is left
		expect(await svc.revoked({ accountId: 'acc-a', connectionId: 'claude-desktop', hash: 'hash-a1' })).toMatchObject({ ok: true, connection: { revokePending: [] } });
	});

	test('replace-quit: Claude running → the plan asks to quit it before any key exists; apply without allowQuit changes nothing; with it Claude is quit, the entry removed, and opening the bundle starts Claude again', async () => {
		const { env, state, svc } = machine({ running: true, files: { [CONFIG]: CONFIG_TEXT } });
		const shown: any = await planOf(svc);

		expect(shown).toMatchObject({ canApply: true, preflight: 'quitApp', replace: { targetPath: CONFIG } });
		expect(await svc.apply(bundle({ replace: shown.replace }))).toEqual({ ok: false, needs: 'quitApp' });
		expect(env.files()[CONFIG]).toBe(CONFIG_TEXT);
		expect(records(env)).toEqual([]);
		expect(state.killed).toEqual([]);

		expect(await svc.apply(bundle({ replace: shown.replace, allowQuit: true }))).toMatchObject({ ok: true });
		expect(state.killed).toEqual([ 42 ]);
		expect(JSON.parse(env.files()[CONFIG]).mcpServers.anytype).toBeUndefined();
		expect(state.opened).toEqual([ [ '-a', APP, copies(env)[0] ] ]);
	});

	test('replace-configure: our extension installed as well (both routes) → Replace removes the entry; nothing is opened, so the Claude Anytype quit is started again for its Configure', async () => {
		const ext = 'local.mcpb.anytype.anytype-dev';
		const { env, state, svc } = machine({
			running: true,
			files: {
				[CONFIG]: CONFIG_TEXT,
				[`${DIR}/extensions-installations.json`]: JSON.stringify({ extensions: { [ext]: { id: ext, version: '2.6.0', installedAt: 't1' } } }),
				[`${DIR}/Claude Extensions Settings/${ext}.json`]: JSON.stringify({ isEnabled: true }),
			},
		});
		const shown: any = await planOf(svc);

		expect(shown).toMatchObject({ canApply: true, configure: true, preflight: 'quitApp', replace: { targetPath: CONFIG } });
		expect(await svc.apply(bundle({ replace: shown.replace, allowQuit: true }))).toMatchObject({ ok: true, configure: true, connection: { bundleState: 'notConfirmed' } });
		expect(state.killed).toEqual([ 42 ]);
		expect(JSON.parse(env.files()[CONFIG]).mcpServers.anytype).toBeUndefined();
		expect(state.opened).toEqual([ [ '-a', APP ] ]);
		expect(copies(env)).toEqual([]);
	});

	test('replace-quit: a running state that can\'t be read → the user quits Claude (quitAppSelf); several Claude processes are never written behind', async () => {
		const unknown = machine({ running: 'unknown', files: { [CONFIG]: CONFIG_TEXT } });
		const shown: any = await planOf(unknown.svc);

		expect(shown).toMatchObject({ preflight: 'quitAppSelf' });
		expect(await unknown.svc.apply(bundle({ replace: shown.replace, allowQuit: true }))).toEqual({ ok: false, needs: 'quitAppSelf' });
		expect(await unknown.svc.apply(bundle({ replace: shown.replace, quitConfirmed: true }))).toMatchObject({ ok: true });
		expect(JSON.parse(unknown.env.files()[CONFIG]).mcpServers.anytype).toBeUndefined();

		const two = machine({ files: { [CONFIG]: CONFIG_TEXT } });

		two.env.listProcesses = async () => [ { pid: 42, ppid: 1, exe: EXE, cmd: '' }, { pid: 43, ppid: 1, exe: EXE, cmd: '' } ];
		expect(await two.svc.apply(bundle({ replace: shown.replace, allowQuit: true, quitConfirmed: true }))).toEqual({ ok: false, needs: 'quitAppSelf' });
		expect(two.env.files()[CONFIG]).toBe(CONFIG_TEXT);
	});

	test('replace-quit: Claude doesn\'t quit after the commit → the commit is undone, the entry stays, nothing copied', async () => {
		const { env, state, svc } = machine({ running: true, files: { [CONFIG]: CONFIG_TEXT } });
		const shown: any = await planOf(svc);

		// The quit signal is ignored: Claude keeps running (an unsaved-work dialog)
		env.kill = (pid: number) => {
			state.killed.push(pid);
			return true;
		};

		const res: any = await svc.apply(bundle({ replace: shown.replace, allowQuit: true }));

		expect(res.ok).toBe(false);
		expect(res.error).toMatchObject({ stage: 'restart', category: 'timeout' });
		expect(records(env)).toEqual([]);
		expect(env.files()[CONFIG]).toBe(CONFIG_TEXT);
		expect(env.clip.writes).toEqual([]);
		expect(state.opened).toEqual([]);
	});

	test('replace-unreadable: a settings file that can\'t be read or parsed, or one inside Anytype\'s own folder, is refused as before (plan and apply)', async () => {
		const cases: Opt[] = [
			{ files: { [CONFIG]: '{ broken' } },
			{ files: { [CONFIG]: '[1, 2' } },
			{ files: { '/Users/me/.anytype/claude.json': JSON.stringify({ mcpServers: { anytype: FOREIGN } }) }, links: { [CONFIG]: '/Users/me/.anytype/claude.json' } },
		];

		for (const opt of cases) {
			const { env, svc } = machine(opt);
			const before = JSON.stringify(env.files());

			expect(await planOf(svc)).toMatchObject({ canApply: false, error: { category: 'conflict' }, note: 'aiConnectClaudeBothConfig' });
			expect(await svc.apply(bundle())).toMatchObject({ ok: false, error: { category: 'conflict' } });
			// A consent changes nothing about it (the linked file isn't even the card's target: a fresh preview first)
			expect(await svc.apply(bundle({ replace: consentFor(FOREIGN) }))).toMatchObject({ ok: false, error: { category: opt.links ? 'changed' : 'conflict' } });
			expect(JSON.stringify(env.files())).toBe(before);
			expect(records(env)).toEqual([]);
		};
	});

	test('replace-reverse: the extension there and the settings-file route chosen → still refused (Anytype can\'t remove an extension)', async () => {
		const ext = 'local.mcpb.anytype.anytype-dev';
		const { env, svc } = machine({
			files: {
				[CONFIG]: '{}',
				[`${DIR}/extensions-installations.json`]: JSON.stringify({ extensions: { [ext]: { id: ext, version: '2.6.0', installedAt: 't1' } } }),
				[`${DIR}/Claude Extensions Settings/${ext}.json`]: JSON.stringify({ isEnabled: true }),
			},
		});

		expect(await svc.plan(planParam({ appId: 'claude-desktop', route: 'stdio', method: 'config' }))).toMatchObject({ canApply: false, note: 'aiConnectClaudeBothExtension' });
		expect(await svc.apply(config())).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(env.files()[CONFIG]).toBe('{}');
	});
});

describe('Claude Desktop: the key on the clipboard, as main reports it', () => {
	test('clipboard-state: `keyCopied` from the copy until main clears it (the deadline), and again after Copy key', async () => {
		const { env, svc } = machine();
		let now = 1000;

		env.now = () => now;
		expect(await svc.apply(bundle())).toMatchObject({ ok: true, connection: { keyCopied: true } });

		const view = async () => (await svc.check({ accountId: 'acc-a', apiListening: true, port: 31009, keys: null }) as any).connections[0];

		expect((await view()).keyCopied).toBe(true);
		now += CLIPBOARD_TTL_MS;
		env.fireTimers();
		expect((await view()).keyCopied).toBeUndefined();

		expect(await svc.copySecret({ accountId: 'acc-a', connectionId: 'claude-desktop', text: KEY_A })).toEqual({ ok: true });
		expect((await view()).keyCopied).toBe(true);

		// Another sheet's copy replaces it: not this record's key on the clipboard any more
		expect(await svc.copySecret({ accountId: 'acc-a', appHash: 'hash-other', text: KEY_B })).toEqual({ ok: true });
		expect((await view()).keyCopied).toBeUndefined();
	});
});

describe('Claude Desktop: a build without a usable bundle', () => {
	test('bundle-missing: a development build without the forwarder → `bundleMissing` with the development hint, never `unsupportedPackage`; plan and apply', async () => {
		// What scripts/build-mcp.js writes for a development build without a forwarder
		const { env, svc } = machine({ bare: true, meta: JSON.stringify({ signed: false, forwarder: null, mcpb: null }) });
		const res: any = await planOf(svc);

		expect(res).toMatchObject({ ok: true, canApply: false, method: 'manual', steps: [], needsKey: false, error: { stage: 'verify', category: 'bundleMissing', devBuild: true } });
		expect(await svc.apply(bundle())).toEqual({ ok: false, error: { stage: 'verify', category: 'bundleMissing', devBuild: true } });
		expect(records(env)).toEqual([]);
	});

	test('bundle-missing: a release build whose bundle is missing or damaged → `bundleMissing` without the development hint; the settings file stays offered by hand', async () => {
		const missing = machine({ signed: true, noBundle: true });
		const res: any = await planOf(missing.svc);

		expect(res).toMatchObject({ canApply: false, method: 'manual', needsKey: true, error: { stage: 'verify', category: 'bundleMissing' } });
		expect(res.error.devBuild).toBeUndefined();
		expect(res.steps.length).toBeGreaterThan(0);

		const damaged = machine({ signed: true });

		damaged.env.unlink(`${MCP_DIR}/Anytype.mcpb`);
		damaged.env.writeFile(`${MCP_DIR}/Anytype.mcpb`, 'tampered', 0o644).close();
		expect(await damaged.svc.apply(bundle())).toEqual({ ok: false, error: { stage: 'verify', category: 'bundleMissing' } });
	});

	test('bundle-missing: `unsupportedPackage` stays the Linux package\'s (no stdio from a Snap, Flatpak or portable AppImage)', async () => {
		const { svc } = machine({ bare: true });

		expect(JSON.stringify(await planOf(svc))).not.toContain('unsupportedPackage');
	});
});

describe('Claude Desktop: review round 1 (main)', () => {
	const TXN = `${REGISTRY}.txn`;
	const own = async (m: ReturnType<typeof machine>) => {
		expect(await m.svc.apply(config())).toMatchObject({ ok: true, connection: { method: 'config', appHash: 'hash-a1' } });

		const shown: any = await planOf(m.svc);

		expect(shown).toMatchObject({ existing: 'ours', replace: { targetPath: CONFIG } });
		return shown;
	};
	const intentOf = async (svc: any): Promise<string> => ((await svc.mintIntent({ accountId: 'acc-a', name: 'Claude Desktop', time: 1 })) as any).id;
	const rotate = (shown: any, over: Record<string, any> = {}) => bundle({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1', replace: shown.replace, ...over });

	test('R1: Anytype stops right after the first save (waiting for Claude to quit) → the next run has the earlier record back, its key never queued, and the new key orphaned', async () => {
		const m = machine({ files: { [CONFIG]: '{}' } });
		const shown = await own(m);
		const intentId = await intentOf(m.svc);
		let snapshot: { reg: string; config: string } | null = null;
		const kill = m.env.kill;

		m.state.running = true;
		m.env.kill = (pid, signal) => {
			snapshot = snapshot || { reg: m.env.readText(REGISTRY), config: m.env.files()[CONFIG] };
			return kill(pid, signal);
		};
		expect(await m.svc.apply(rotate(shown, { allowQuit: true, intentId }))).toMatchObject({ ok: true });

		// The first save, as it was on disk while Claude was quitting: staged, the old key not queued
		const first = JSON.parse(snapshot.reg).connections[0];

		expect(first).toMatchObject({ method: 'package', appHash: 'hash-a2', revokePending: [], staged: { before: { method: 'config', appHash: 'hash-a1' } } });

		// Anytype stopped right then: the disk as it was, a new run
		put(m.env, REGISTRY, snapshot.reg);
		put(m.env, CONFIG, snapshot.config);

		const next = service(m.env);
		const listed: any = await next.list({ accountId: 'acc-a' });

		expect(listed.connections).toHaveLength(1);
		expect(listed.connections[0]).toMatchObject({ method: 'config', appHash: 'hash-a1', revokePending: [] });
		expect(listed.connections[0].staged).toBeUndefined();
		expect(listed.orphanHashes).toEqual([ 'hash-a2' ]);
		expect(records(m.env)[0].staged).toBeUndefined();
		// The entry Claude uses is untouched, and its key is no one's to revoke
		expect(JSON.parse(m.env.files()[CONFIG]).mcpServers.anytype.env.ANYTYPE_API_KEY).toBe(KEY_A);
		expect(registry(m.env).mintIntents).toBeUndefined();
	});

	test('R1: the removal fails and its undo can\'t be saved → not reported as done, the old key never queued; the next call puts the earlier record and the intent back', async () => {
		const m = machine({ files: { [CONFIG]: '{}' } });
		const shown = await own(m);
		const before = records(m.env)[0];
		const intentId = await intentOf(m.svc);
		const rename = m.env.rename;
		let failRegistry = false;

		m.state.running = true;
		// Claude won't quit (an unsaved-work dialog); from then on the registry can't be saved
		m.env.kill = (pid: number) => {
			m.state.killed.push(pid);
			failRegistry = true;
			return true;
		};
		m.env.rename = (from, to) => {
			if (failRegistry && (to == REGISTRY)) {
				throw Object.assign(new Error('EIO'), { code: 'EIO' });
			};
			rename(from, to);
		};

		expect(await m.svc.apply(rotate(shown, { allowQuit: true, intentId }))).toEqual({ ok: false, error: { stage: 'write', category: 'unsaved' } });
		expect(records(m.env)[0]).toMatchObject({ method: 'package', appHash: 'hash-a2', revokePending: [], staged: { before: { appHash: 'hash-a1' } } });
		expect(m.env.clip.writes).toEqual([]);
		expect(m.env.files()[CONFIG]).toContain(KEY_A);

		failRegistry = false;
		await m.svc.list({ accountId: 'acc-a' });
		expect(records(m.env)).toEqual([ before ]);
		// This run's flow still holds the new key: its intent is back (the flow releases or reuses it), never an orphan
		expect(registry(m.env).mintIntents).toEqual([ expect.objectContaining({ id: intentId }) ]);
		expect(registry(m.env).orphanHashes).toEqual([]);
	});

	test('R2: Anytype stops between the commit\'s rename and its undo file\'s removal → the next run has the earlier record and the new key tracked (an orphan)', async () => {
		const m = machine({ files: { [CONFIG]: '{}' } });
		const shown = await own(m);
		const intentId = await intentOf(m.svc);
		const unlink = m.env.unlink;
		const list = m.env.listProcesses;
		let armed = false;

		// The first save writes no undo (it queues nothing); the commit's undo file can't go: Anytype "stops" there
		m.env.listProcesses = async () => {
			armed = armed || !!records(m.env)[0]?.staged;
			return list();
		};
		m.env.unlink = p => {
			if (armed && (p == TXN)) {
				throw Object.assign(new Error('EIO'), { code: 'EIO' });
			};
			unlink(p);
		};

		expect(await m.svc.apply(rotate(shown, { intentId }))).toEqual({ ok: false, error: { stage: 'write', category: 'unsaved' } });
		expect(m.env.exists(TXN)).toBe(true);
		expect(m.env.clip.writes).toEqual([]);

		// A new run: the undo file puts the staged record back, and that is undone in turn
		armed = false;

		const next = service(m.env);
		const listed: any = await next.list({ accountId: 'acc-a' });

		expect(listed.connections).toEqual([ expect.objectContaining({ method: 'config', appHash: 'hash-a1', revokePending: [] }) ]);
		expect(listed.orphanHashes).toEqual([ 'hash-a2' ]);
		expect(registry(m.env).mintIntents).toBeUndefined();
	});

	test('R3: the agreed entry is gone at apply\'s locked read and back before the save → the last check removes it before the key is copied', async () => {
		const m = machine({ files: { [CONFIG]: CONFIG_TEXT } });
		const shown: any = await planOf(m.svc);
		const list = m.env.listProcesses;
		const rename = m.env.rename;
		let gone = false;

		m.env.listProcesses = async () => {
			if (!records(m.env).length && !gone) {
				gone = true;
				put(m.env, CONFIG, '{"mcpServers":{}}');
			};
			return list();
		};
		m.env.rename = (from, to) => {
			rename(from, to);
			// The first save: the entry is back (another profile, the user)
			if ((to == REGISTRY) && gone && records(m.env)[0]?.staged) {
				put(m.env, CONFIG, CONFIG_TEXT);
			};
		};

		expect(await m.svc.apply(bundle({ replace: shown.replace }))).toMatchObject({ ok: true });
		expect(JSON.parse(m.env.files()[CONFIG]).mcpServers.anytype).toBeUndefined();
		expect(m.env.clip.writes).toEqual([ KEY_A ]);
		expect(m.state.opened).toHaveLength(1);
	});

	test('R3: an entry that appears after apply\'s checks, with no Replace agreed → refused at the last check, the save undone, nothing copied or opened', async () => {
		const m = machine({ files: { [CONFIG]: '{}' } });
		const rename = m.env.rename;
		let added = false;

		m.env.rename = (from, to) => {
			rename(from, to);
			if ((to == REGISTRY) && !added && records(m.env)[0]?.staged) {
				added = true;
				put(m.env, CONFIG, JSON.stringify({ mcpServers: { anytype: FOREIGN } }));
			};
		};

		expect(await m.svc.apply(bundle())).toMatchObject({ ok: false, error: { stage: 'validate', category: 'conflict' } });
		expect(records(m.env)).toEqual([]);
		expect(m.env.clip.writes).toEqual([]);
		expect(m.state.opened).toEqual([]);
		expect(JSON.parse(m.env.files()[CONFIG]).mcpServers.anytype).toEqual(FOREIGN);
	});

	test('R4: Claude stopped at the first lookup and running at the next one → never quit without quit consent; the user is asked', async () => {
		const m = machine({ files: { [CONFIG]: CONFIG_TEXT } });
		const shown: any = await planOf(m.svc);
		let lookups = 0;

		m.env.listProcesses = async () => ((++lookups > 1) ? [ { pid: 42, ppid: 1, exe: EXE, cmd: '' } ] : []);
		expect(await m.svc.apply(bundle({ replace: shown.replace }))).toEqual({ ok: false, needs: 'quitApp' });
		expect(m.state.killed).toEqual([]);
		expect(m.env.files()[CONFIG]).toBe(CONFIG_TEXT);
		expect(records(m.env)).toEqual([]);
	});

	test('R5: Claude starts between the writer\'s check and its rename → the rename doesn\'t happen, the entry stays, the save is undone', async () => {
		const m = machine({ files: { [CONFIG]: CONFIG_TEXT } });
		const shown: any = await planOf(m.svc);
		const rename = m.env.rename;
		let renamed = false;
		let lookups = 0;

		// Lookups: apply's check, the last check's two (the entry's, the writer's), then the one right before the rename
		m.env.listProcesses = async () => ((++lookups >= 4) ? [ { pid: 42, ppid: 1, exe: EXE, cmd: '' } ] : []);
		m.env.rename = (from, to) => {
			renamed = renamed || (to == CONFIG);
			rename(from, to);
		};

		expect(await m.svc.apply(bundle({ replace: shown.replace }))).toEqual({ ok: false, needs: 'quitApp' });
		expect(renamed).toBe(false);
		expect(m.env.files()[CONFIG]).toBe(CONFIG_TEXT);
		expect(records(m.env)).toEqual([]);
		expect(leftovers(m.env)).toEqual([]);
	});

	test('R6: an entry the writer can\'t remove (two `anytype` members) is never offered for Replace; apply refuses it before quitting Claude', async () => {
		const twice = `{"mcpServers":{"anytype":${JSON.stringify(FOREIGN)},"anytype":${JSON.stringify(FOREIGN)}}}`;
		const m = machine({ running: true, files: { [CONFIG]: twice } });
		const res: any = await planOf(m.svc);

		expect(res).toMatchObject({ canApply: false, method: 'manual', note: 'aiConnectClaudeReplaceCantRemove', error: { stage: 'parse' } });
		expect(res.replace).toBeUndefined();
		expect(await m.svc.apply(bundle({ replace: consentFor(FOREIGN), allowQuit: true }))).toMatchObject({ ok: false, error: { stage: 'parse' } });
		expect(m.state.killed).toEqual([]);
		expect(m.env.files()[CONFIG]).toBe(twice);
		expect(records(m.env)).toEqual([]);
	});

	test('R7: `keyCopied` only for the record\'s own key: never for a snippet with it or for another key, with the copy\'s deadline', async () => {
		const m = machine();
		let now = 1000;

		m.env.now = () => now;

		const res: any = await m.svc.apply(bundle());

		expect(res.connection).toMatchObject({ keyCopied: true, keyCopiedUntil: 1000 + CLIPBOARD_TTL_MS });

		const view = async () => (await m.svc.check({ accountId: 'acc-a', apiListening: true, port: 31009, keys: null }) as any).connections[0];

		now = 2000;
		expect(await m.svc.copySecret({ accountId: 'acc-a', connectionId: 'claude-desktop', text: `{"env":{"ANYTYPE_API_KEY":"${KEY_A}"}}` })).toEqual({ ok: true });
		expect((await view()).keyCopied).toBeUndefined();
		expect(await m.svc.copySecret({ accountId: 'acc-a', connectionId: 'claude-desktop', text: KEY_B })).toEqual({ ok: true });
		expect((await view()).keyCopied).toBeUndefined();
		expect(await m.svc.copySecret({ accountId: 'acc-a', connectionId: 'claude-desktop', text: KEY_A })).toEqual({ ok: true });
		expect(await view()).toMatchObject({ keyCopied: true, keyCopiedUntil: 2000 + CLIPBOARD_TTL_MS });
	});

	test('R11: Configure after Anytype quit Claude: a failed start is reported (openFailed), not hidden', async () => {
		const ext = 'local.mcpb.anytype.anytype-dev';
		const m = machine({
			running: true, relaunchFails: true,
			files: {
				[CONFIG]: CONFIG_TEXT,
				[`${DIR}/extensions-installations.json`]: JSON.stringify({ extensions: { [ext]: { id: ext, version: '2.6.0', installedAt: 't1' } } }),
				[`${DIR}/Claude Extensions Settings/${ext}.json`]: JSON.stringify({ isEnabled: true }),
			},
		});
		const shown: any = await planOf(m.svc);

		expect(shown).toMatchObject({ configure: true });
		expect(await m.svc.apply(bundle({ replace: shown.replace, allowQuit: true }))).toMatchObject({ ok: true, configure: true, openFailed: true });
		expect(m.state.opened).toEqual([ [ '-a', APP ] ]);
	});

	test('R12: a config record whose entry the user removed before apply → the extension\'s record keeps no settings-file ownership', async () => {
		const m = machine({ files: { [CONFIG]: '{}' } });
		const shown = await own(m);

		expect(records(m.env)[0]).toMatchObject({ entryDigest: expect.any(String), configPath: CONFIG });
		put(m.env, CONFIG, '{"mcpServers":{}}');
		expect(await m.svc.apply(rotate(shown))).toMatchObject({ ok: true, connection: { method: 'package', appHash: 'hash-a2', revokePending: [ 'hash-a1' ] } });
		expect(records(m.env)[0].entryDigest).toBeUndefined();
		expect(records(m.env)[0].configPath).toBeUndefined();
	});

	test('R13: the development hint only for metadata that says `signed: false`; missing or broken metadata gets the reinstall text', async () => {
		for (const meta of [ null, '{ broken', '{"forwarder":null}' ]) {
			const { svc } = machine({ bare: true, meta });
			const res: any = await planOf(svc);

			expect(res.error).toEqual({ stage: 'verify', category: 'bundleMissing' });
		};

		const dev = machine({ bare: true, meta: JSON.stringify({ signed: false, forwarder: null, mcpb: null }) });

		expect((await planOf(dev.svc) as any).error).toEqual({ stage: 'verify', category: 'bundleMissing', devBuild: true });
	});

	test('R16: Claude rewrites the entry while it quits → the changed entry survives, the earlier record and the intent come back, no key is copied, Claude is started again', async () => {
		const m = machine({ files: { [CONFIG]: '{}' } });
		const shown = await own(m);
		const before = records(m.env)[0];
		const intentId = await intentOf(m.svc);
		const rewritten = JSON.stringify({ mcpServers: { anytype: { ...serveCommand(m.env, { tier: 'large', key: KEY_A }), args: [ 'serve', '--tier', 'small' ] } } });

		m.state.running = true;
		// Claude's shutdown writes its cached settings before the process ends
		m.env.kill = (pid: number) => {
			m.state.killed.push(pid);
			put(m.env, CONFIG, rewritten);
			m.state.running = false;
			return true;
		};

		expect(await m.svc.apply(rotate(shown, { allowQuit: true, intentId }))).toMatchObject({ ok: false, error: { stage: 'validate', category: 'conflict' } });
		expect(m.state.killed).toEqual([ 42 ]);
		expect(m.env.files()[CONFIG]).toBe(rewritten);
		expect(records(m.env)).toEqual([ before ]);
		expect(registry(m.env).mintIntents).toEqual([ expect.objectContaining({ id: intentId }) ]);
		expect(m.env.clip.writes).toEqual([]);
		expect(m.state.opened).toEqual([ [ '-a', APP ] ]);
	});
});

describe('Claude Desktop: final review (main)', () => {
	const own = async (m: ReturnType<typeof machine>) => {
		expect(await m.svc.apply(config())).toMatchObject({ ok: true, connection: { method: 'config', appHash: 'hash-a1' } });
		return planOf(m.svc) as Promise<any>;
	};
	const rotate = (shown: any, over: Record<string, any> = {}) => bundle({ key: KEY_B, appHash: 'hash-a2', expectedHash: 'hash-a1', replace: shown.replace, ...over });
	const queues = (env: FakeEnv, file: string, hash: string): boolean => (JSON.parse(env.readText(file) || '{"connections":[]}').connections || []).some((r: any) => (r.revokePending || []).includes(hash));

	test('F2: an edit made while the writer looks Claude up is never written over: the changed entry and the new preference survive, the save is undone', async () => {
		const m = machine({ files: { [CONFIG]: CONFIG_TEXT } });
		const shown: any = await planOf(m.svc);
		const edited = CONFIG_TEXT.replace(FOREIGN_KEY, 'SENTINEL-edited-key-0123456789abcdef').replace('"menuBar": true', '"menuBar": true, "theme": "dark"');
		let lookups = 0;

		// Lookups: apply's check, the last check's two (the entry's, the writer's), then the one right before the rename
		m.env.listProcesses = async () => {
			if (++lookups == 4) {
				put(m.env, CONFIG, edited);
			};
			return [];
		};

		expect(await m.svc.apply(bundle({ replace: shown.replace }))).toMatchObject({ ok: false, error: { stage: 'validate', category: 'conflict' } });
		expect(m.env.files()[CONFIG]).toBe(edited);
		expect(records(m.env)).toEqual([]);
		expect(m.env.clip.writes).toEqual([]);
	});

	test('F2: a preference Claude saves during that lookup (the entry unchanged) is kept: the entry goes, the preference stays', async () => {
		const m = machine({ files: { [CONFIG]: CONFIG_TEXT } });
		const shown: any = await planOf(m.svc);
		const edited = CONFIG_TEXT.replace('"menuBar": true', '"menuBar": true, "theme": "dark"');
		let lookups = 0;

		m.env.listProcesses = async () => {
			if (++lookups == 4) {
				put(m.env, CONFIG, edited);
			};
			return [];
		};

		expect(await m.svc.apply(bundle({ replace: shown.replace }))).toMatchObject({ ok: true });

		const after = JSON.parse(m.env.files()[CONFIG]);

		expect(after.mcpServers).toEqual({ other: { command: 'o', args: [ 'x' ] } });
		expect(after.preferences).toEqual({ menuBar: true, theme: 'dark' });
	});

	test('F3: Claude\'s settings resolving to another (empty) file after the first save → refused, the earlier record back, its key not queued, its entry where it was', async () => {
		const A = `${DIR}/settings-a.json`;
		const B = `${DIR}/settings-b.json`;
		const m = machine({ files: { [A]: '{}', [B]: '{}' }, links: { [CONFIG]: A } });

		expect(await m.svc.apply(config())).toMatchObject({ ok: true, connection: { method: 'config', appHash: 'hash-a1', configPath: A } });

		const before = records(m.env)[0];
		const shown: any = await planOf(m.svc);
		const rename = m.env.rename;

		expect(shown).toMatchObject({ existing: 'ours', replace: { targetPath: A } });
		m.env.rename = (from, to) => {
			rename(from, to);
			if ((to == REGISTRY) && records(m.env)[0]?.staged) {
				m.env.link(CONFIG, B);
			};
		};

		expect(await m.svc.apply(rotate(shown))).toMatchObject({ ok: false, error: { stage: 'validate', category: 'conflict' } });
		expect(records(m.env)).toEqual([ before ]);
		expect(JSON.parse(m.env.files()[A]).mcpServers.anytype.env.ANYTYPE_API_KEY).toBe(KEY_A);
		expect(m.env.files()[B]).toBe('{}');
		expect(m.env.clip.writes).toEqual([]);
	});

	test('F4: the settings file\'s folder is synced after the entry\'s removal and before the save that queues the old key; a sync that fails queues nothing', async () => {
		const m = machine({ files: { [CONFIG]: '{}' } });
		const shown = await own(m);
		const events: string[] = [];
		const rename = m.env.rename;
		const fsync = m.env.fsyncDir;

		m.env.rename = (from, to) => {
			if (to == CONFIG) {
				events.push('config');
			};
			if ((to == REGISTRY) && queues(m.env, from, 'hash-a1')) {
				events.push('queue');
			};
			rename(from, to);
		};
		m.env.fsyncDir = p => {
			if (p == DIR) {
				events.push('sync');
			};
			fsync(p);
		};

		expect(await m.svc.apply(rotate(shown))).toMatchObject({ ok: true });
		expect(events).toEqual([ 'config', 'sync', 'queue' ]);

		// The same with a sync that fails: not reported as done, nothing queued
		const f = machine({ files: { [CONFIG]: '{}' } });
		const again = await own(f);
		const before = records(f.env)[0];

		f.env.fsyncDir = p => {
			if (p == DIR) {
				throw Object.assign(new Error('EIO'), { code: 'EIO' });
			};
		};

		expect(await f.svc.apply(rotate(again))).toMatchObject({ ok: false, error: { stage: 'write' } });
		expect(records(f.env)).toEqual([ before ]);
		expect(f.env.clip.writes).toEqual([]);
	});

	test('F5: a bundle copy that can\'t be written stops apply before anything is saved, quit or edited', async () => {
		const m = machine({ running: true, files: { [CONFIG]: CONFIG_TEXT } });
		const shown: any = await planOf(m.svc);
		const rename = m.env.rename;

		m.env.rename = (from, to) => {
			if (to.endsWith('.mcpb')) {
				throw Object.assign(new Error('EACCES'), { code: 'EACCES' });
			};
			rename(from, to);
		};

		expect(await m.svc.apply(bundle({ replace: shown.replace, allowQuit: true }))).toMatchObject({ ok: false, error: { stage: 'write' } });
		expect(m.state.killed).toEqual([]);
		expect(m.env.files()[CONFIG]).toBe(CONFIG_TEXT);
		expect(records(m.env)).toEqual([]);
		expect(m.env.clip.writes).toEqual([]);
		expect(m.state.opened).toEqual([]);
	});

	test('F6: while a staged record can\'t be put back, the list shows the last committed record, and its key isn\'t copied or its bundle opened', async () => {
		const m = machine({ files: { [CONFIG]: '{}' } });
		const shown = await own(m);
		const before = records(m.env)[0];
		const rename = m.env.rename;
		let failRegistry = false;

		m.state.running = true;
		m.env.kill = (pid: number) => {
			m.state.killed.push(pid);
			failRegistry = true;
			return true;
		};
		m.env.rename = (from, to) => {
			if (failRegistry && (to == REGISTRY)) {
				throw Object.assign(new Error('EIO'), { code: 'EIO' });
			};
			rename(from, to);
		};

		expect(await m.svc.apply(rotate(shown, { allowQuit: true }))).toMatchObject({ ok: false, error: { category: 'unsaved' } });
		expect(records(m.env)[0].staged).toBeDefined();

		const listed: any = await m.svc.list({ accountId: 'acc-a' });

		expect(listed.connections).toEqual([ expect.objectContaining({ method: 'config', appHash: 'hash-a1' }) ]);
		expect(JSON.stringify(listed)).not.toContain('hash-a2');
		expect(await m.svc.copySecret({ accountId: 'acc-a', connectionId: 'claude-desktop', text: KEY_B })).toEqual({ ok: false });
		expect(await m.svc.copySecret({ accountId: 'acc-a', appHash: 'hash-a2', text: KEY_B })).toEqual({ ok: false });
		// Open again refuses it even with no settings-file entry in the way (the user removed it meanwhile)
		put(m.env, CONFIG, '{}');
		m.state.opened.length = 0;
		expect(await m.svc.openApp({ appId: 'claude-desktop', bundle: true })).toEqual({ ok: false });
		expect(m.state.opened).toEqual([]);
		expect(m.env.clip.writes).toEqual([]);

		// Storage works again: the earlier record is back on disk
		failRegistry = false;
		await m.svc.list({ accountId: 'acc-a' });
		expect(records(m.env)).toEqual([ before ]);
	});

	test('F7: a refused delivery puts its mint intent back with the exact hash; a later run revokes exactly that key, even beside an ambiguous intent', async () => {
		const m = machine({ files: { [CONFIG]: CONFIG_TEXT } });
		const shown: any = await planOf(m.svc);
		const intent: any = await m.svc.mintIntent({ accountId: 'acc-a', name: 'Claude Desktop', time: 1 });
		const twin: any = await m.svc.mintIntent({ accountId: 'acc-a', name: 'Claude Desktop', time: 1 });
		const rename = m.env.rename;

		// The entry changes after the first save: the last check refuses
		m.env.rename = (from, to) => {
			rename(from, to);
			if ((to == REGISTRY) && records(m.env)[0]?.staged) {
				put(m.env, CONFIG, CONFIG_TEXT.replace(FOREIGN_KEY, 'SENTINEL-edited-key-0123456789abcdef'));
			};
		};

		expect(await m.svc.apply(bundle({ replace: shown.replace, intentId: intent.id }))).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(registry(m.env).mintIntents).toEqual(expect.arrayContaining([ expect.objectContaining({ id: intent.id, appHash: 'hash-a1' }) ]));

		// Anytype stopped before the flow released the key: the next run knows exactly which key it was
		const next = service(m.env);
		const listed: any = await next.list({ accountId: 'acc-a' });

		expect(listed.orphanHashes).toEqual([ 'hash-a1' ]);
		expect(listed.mintIntents.map((it: any) => it.id)).toEqual([ twin.id ]);
		expect(registry(m.env).mintIntents.map((it: any) => it.id)).toEqual([ twin.id ]);
	});
});
