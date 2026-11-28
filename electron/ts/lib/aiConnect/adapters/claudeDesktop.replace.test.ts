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
		apps: [ 'Claude' ], dirs: [ DIR ], signed: opt.signed, files, links: opt.links,
		run: call => {
			if (call.file == '/usr/bin/open') {
				state.opened.push(call.args);
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
		const { env, svc } = machine({ bare: true });
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
