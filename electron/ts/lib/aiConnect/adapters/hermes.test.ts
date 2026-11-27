/**
 * Hermes (default profile): the key in .env, the entry in config.yaml, through the real service on a fake Mac.
 * Anything unusual is refused with manual steps; an `anytype` entry Anytype didn't write is never touched.
 */
import { describe, expect, test, vi } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: () => '/nonexistent', getVersion: () => '0.0.0', getFileIcon: vi.fn(), getApplicationInfoForProtocol: vi.fn() }, shell: { openExternal: vi.fn(), showItemInFolder: vi.fn() } }));
vi.mock('electron-util', () => ({ fixPathForAsarUnpack: (p: string) => p }));

import { KEY_A, KEY_B, applyParam, keysOf, mac, planParam, service } from '../testKit';
import { fakeEnv } from '../testEnv';
import { detectAll, targetFor, resolveHomes } from '../detect';
import { canonicalDigest } from '../digest';
import { readEnvVar, removeEnvVar, setEnvVar } from '../envFile';
import { getYamlPath, readYaml, setYamlPath } from '../yamlFile';
import { gatewayEntry } from './hermes';
import type { Detected } from '../types';

const HOME = '/Users/me/.hermes';
const CONFIG = `${HOME}/config.yaml`;
const ENV = `${HOME}/.env`;
const URL = 'http://127.0.0.1:31009/mcp/full';
const HEADER = 'Bearer ${MCP_ANYTYPE_API_KEY}';
/** As Hermes writes it (PyYAML: indentless lists, folded long strings) plus its trailing comment section */
const CONFIG_TEXT = `model:
  default: anthropic/claude-sonnet-4
  provider: openrouter
toolsets:
- hermes-cli
- web
agent:
  system_prompt: You are a helpful assistant that answers questions about the
    user's notes and keeps answers short, precise and friendly.
mcp_servers:
  github:
    command: npx
    args:
    - -y
    - '@modelcontextprotocol/server-github'

# ── Security ──────────────────────────────────────────
# Keep secrets in .env, never here.
`;
const OUR_LINES = `  anytype:\n    url: ${URL}\n    headers:\n      Authorization: ${HEADER}\n`;
const ENV_TEXT = '# keys\nOPENROUTER_API_KEY=sk-or-1\nGITHUB_TOKEN="ghp x"\n';

const plan = (over = {}) => planParam({ appId: 'hermes', tier: 'full', ...over });
const apply = (over = {}) => applyParam({ appId: 'hermes', tier: 'full', recommendedTier: 'full', name: 'Hermes', ...over });
const installed = (items: Detected[]): string[] => items.filter(it => it.installed).map(it => it.appId).sort();
const snippets = (p: any): string[] => p.steps.map((s: any) => s.snippet).filter(Boolean);
const ALT_SNIPPETS = [ 'MCP_ANYTYPE_ME_API_KEY=<KEY>', `mcp_servers:\n  anytype_me:\n    url: ${URL}\n    headers:\n      Authorization: Bearer \${MCP_ANYTYPE_ME_API_KEY}\n` ];

/** Replaces a file's content in the fake env (a new inode, as another program's save would) */
const overwrite = (env: any, file: string, text: string) => {
	env.unlink(file);
	env.writeFile(file, text, 0o600);
};

/** Runs `fn(to)` right before the env renames something onto `to`; returns the undo */
const onRename = (env: any, fn: (to: string) => void) => {
	const rename = env.rename.bind(env);

	env.rename = (from: string, to: string) => {
		fn(to);
		return rename(from, to);
	};
	return () => {
		env.rename = rename;
	};
};

describe('.env: one line, the rest kept', () => {
	test('set replaces or appends our line only; read unquotes; remove deletes only ours', () => {
		expect(setEnvVar(ENV_TEXT, 'MCP_ANYTYPE_API_KEY', 'k1')).toEqual({ ok: true, text: `${ENV_TEXT}MCP_ANYTYPE_API_KEY=k1\n` });
		expect(setEnvVar('A=1\r\nMCP_ANYTYPE_API_KEY=old\r\nB=2\r\nMCP_ANYTYPE_API_KEY=dup\r\n', 'MCP_ANYTYPE_API_KEY', 'k2')).toEqual({ ok: true, text: 'A=1\r\nMCP_ANYTYPE_API_KEY=k2\r\nB=2\r\n' });
		expect(setEnvVar('A=1\nexport MCP_ANYTYPE_API_KEY=dup\n', 'MCP_ANYTYPE_API_KEY', 'k2')).toEqual({ ok: false, category: 'unsupportedForm' });
		expect(setEnvVar(null, 'MCP_ANYTYPE_API_KEY', 'k3')).toEqual({ ok: true, text: 'MCP_ANYTYPE_API_KEY=k3\n' });
		expect(readEnvVar('X=1\nMCP_ANYTYPE_API_KEY="q=1"\n', 'MCP_ANYTYPE_API_KEY')).toBe('q=1');
		expect(readEnvVar('MCP_ANYTYPE_API_KEY_OTHER=1\n', 'MCP_ANYTYPE_API_KEY')).toBeNull();
		expect(removeEnvVar(`${ENV_TEXT}MCP_ANYTYPE_API_KEY=k\nLAST=1`, 'MCP_ANYTYPE_API_KEY')).toEqual({ ok: true, text: `${ENV_TEXT}LAST=1` });
	});
});

describe('Hermes: detection (default profile)', () => {
	test('the CLI, ~/.hermes/config.yaml or the Hermes Agent app; the target is the default profile\'s config.yaml', async () => {
		expect(installed((await detectAll(mac({ files: { [CONFIG]: '' } }))).items)).toEqual([ 'hermes' ]);
		expect(installed((await detectAll(mac({ shell: { hermes: '/Users/me/.local/bin/hermes' }, files: { '/Users/me/.local/bin/hermes': '' } }))).items)).toEqual([ 'hermes' ]);

		const app = (await detectAll(mac({ apps: [ 'Hermes Agent' ] }))).items.find(it => it.appId == 'hermes');

		expect(app).toMatchObject({ installed: true, appPath: '/Applications/Hermes Agent.app', targetId: 'hermes', targetPaths: [ CONFIG ] });
		expect(installed((await detectAll(mac({ files: { [`${HOME}/profiles/work/config.yaml`]: '' } }))).items)).toEqual([]);

		const win = fakeEnv({ platform: 'win32', home: 'C:\\Users\\me', vars: { LOCALAPPDATA: 'C:\\Users\\me\\AppData\\Local', SystemRoot: 'C:\\Windows' }, dirs: [ 'C:\\Users\\me\\AppData\\Local\\hermes' ] });

		expect(targetFor(win, await resolveHomes(win), 'hermes')).toEqual({ targetId: 'hermes', targetPaths: [ 'C:\\Users\\me\\AppData\\Local\\hermes\\config.yaml' ] });
	});
});

describe('Hermes: connect', () => {
	test('H1: a Hermes-written config auto-applies; the text diff is exactly our entry; the key goes to .env first (0600, no copy)', async () => {
		const env = mac({ files: { [CONFIG]: CONFIG_TEXT, [ENV]: ENV_TEXT }, modes: { [ENV]: 0o644 } });
		const svc = service(env);
		const order: string[] = [];

		onRename(env, to => order.push(to));

		const p: any = await svc.plan(plan());

		expect(p).toMatchObject({ ok: true, canApply: true, method: 'config', nextStep: 'reloadServer', targetId: 'hermes', displayTarget: '~/.hermes/config.yaml', instructions: { reloadServer: 'aiConnectStepHermesReload' } });
		expect(JSON.stringify(p)).not.toContain(KEY_A);
		expect(snippets(p)).toEqual([ 'MCP_ANYTYPE_API_KEY=<KEY>', `mcp_servers:\n${OUR_LINES}` ]);

		expect(await svc.apply(apply())).toMatchObject({ ok: true, connection: { id: 'hermes', targetPath: CONFIG, nextStep: 'reloadServer', observedInstalled: true } });
		expect(order.filter(p => [ ENV, CONFIG ].includes(p))).toEqual([ ENV, CONFIG ]);
		expect(env.files()[CONFIG]).toBe(CONFIG_TEXT.replace(`    - '@modelcontextprotocol/server-github'\n`, `    - '@modelcontextprotocol/server-github'\n${OUR_LINES}`));
		expect(env.files()[ENV]).toBe(`${ENV_TEXT}MCP_ANYTYPE_API_KEY=${KEY_A}\n`);
		expect(env.modeOf(ENV)).toBe(0o600);
		expect(env.files()[`${CONFIG}.anytype-backup`]).toBe(CONFIG_TEXT);

		// Ours: the check is ok, a port change heals only the entry
		const checked: any = await svc.check({ accountId: 'acc-a', apiListening: true, port: 31010, keys: keysOf([ 'hash-a1' ]) });

		expect(checked.connections[0].status).toBe('ok');
		expect(getYamlPath(env.files()[CONFIG], [ 'mcp_servers', 'anytype', 'url' ])).toBe('http://127.0.0.1:31010/mcp/full');
		expect(env.files()[`${ENV}.anytype-backup`]).toBeUndefined();
	});

	test('reconnect with a new key: the .env line changes, the entry stays ours; removal deletes only our line and entry', async () => {
		const env = mac({ files: { [CONFIG]: CONFIG_TEXT, [ENV]: ENV_TEXT } });
		const svc = service(env);

		await svc.apply(apply());
		expect(await svc.apply(apply({ key: KEY_B, appHash: 'hash-b1', expectedHash: 'hash-a1' }))).toMatchObject({ ok: true });
		expect(readEnvVar(env.files()[ENV], 'MCP_ANYTYPE_API_KEY')).toBe(KEY_B);
		expect(env.files()[ENV].match(/MCP_ANYTYPE_API_KEY/g)).toHaveLength(1);

		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'hermes', expectedHash: 'hash-b1' })).toMatchObject({ ok: true });
		expect(env.files()[ENV]).toBe(ENV_TEXT);
		expect(env.files()[CONFIG]).toBe(CONFIG_TEXT);
		expect(env.files()[`${ENV}.anytype-backup`]).toBeUndefined();
	});
});

describe('H1: the YAML edit is lossless, or refused', () => {
	test('H1: a 19-digit id, 0x1F or 1e3 elsewhere: manual, and the file is byte-identical after apply', async () => {
		for (const extra of [ 'discord:\n  channel: 1234567890123456789\n', 'limits:\n  mask: 0x1F\n', 'limits:\n  max: 1e3\n' ]) {
			const text = CONFIG_TEXT.replace('model:\n', `${extra}model:\n`);
			const env = mac({ files: { [CONFIG]: text, [ENV]: ENV_TEXT } });
			const svc = service(env);

			expect(await svc.plan(plan())).toMatchObject({ canApply: false, method: 'manual' });
			expect(await svc.apply(apply())).toMatchObject({ ok: false });
			expect(env.files()[CONFIG]).toBe(text);
			expect(env.files()[ENV]).toBe(ENV_TEXT);
		};
	});

	test('H1: an inline << merge that supplies anytype is refused, never taken as absent', async () => {
		const text = 'mcp_servers:\n  <<: { anytype: { url: "http://127.0.0.1:31012/mcp/full" } }\n';
		const env = mac({ files: { [CONFIG]: text } });
		const p: any = await service(env).plan(plan());

		expect(setYamlPath(text, [ 'mcp_servers', 'anytype' ], {})).toEqual({ ok: false, category: 'unsupportedForm' });
		expect(p).toMatchObject({ canApply: false });
		expect(snippets(p)).toEqual(ALT_SNIPPETS);
		expect(await service(env).apply(apply())).toMatchObject({ ok: false });
		expect(env.files()[CONFIG]).toBe(text);
	});

	test('H1: a deeply nested document is unparseable and never throws, also from check', async () => {
		const deep = `x: ${'['.repeat(20000)}${']'.repeat(20000)}\n`;

		expect(setYamlPath(deep, [ 'a' ], 1)).toEqual({ ok: false, category: 'unparseable' });
		expect(readYaml(deep)).toEqual({ error: true });

		const env = mac({ files: { [CONFIG]: CONFIG_TEXT, [ENV]: ENV_TEXT } });
		const svc = service(env);

		await svc.apply(apply());
		overwrite(env, CONFIG, deep);

		const res: any = await svc.check({ accountId: 'acc-a', apiListening: true, port: 31009, keys: keysOf([ 'hash-a1' ]) });

		expect(res.ok).toBe(true);
		expect(res.connections[0].status).toBe('unreadable');
	});
});

describe('H2: .env comes from the profile folder', () => {
	test('H2: config.yaml linked into ~/dotfiles: the key lands in ~/.hermes/.env, nothing next to the link target', async () => {
		const env = mac({ files: { '/Users/me/dotfiles/hermes.yaml': CONFIG_TEXT, [ENV]: ENV_TEXT }, dirs: [ HOME ], links: { [CONFIG]: '/Users/me/dotfiles/hermes.yaml' } });
		const svc = service(env);

		expect(await svc.apply(apply())).toMatchObject({ ok: true });
		expect(readEnvVar(env.files()[ENV], 'MCP_ANYTYPE_API_KEY')).toBe(KEY_A);
		expect(env.files()['/Users/me/dotfiles/.env']).toBeUndefined();
	});

	test('H2: .env linked outside home: manual, no key-bearing step, nothing written', async () => {
		const env = mac({ files: { [CONFIG]: CONFIG_TEXT, '/opt/secrets/hermes.env': ENV_TEXT }, links: { [ENV]: '/opt/secrets/hermes.env' } });
		const svc = service(env);
		const p: any = await svc.plan(plan());

		expect(p).toMatchObject({ canApply: false, method: 'manual' });
		expect(JSON.stringify(p.steps)).not.toContain('<KEY>');
		expect(await svc.apply(apply())).toMatchObject({ ok: false });
		expect(env.files()[CONFIG]).toBe(CONFIG_TEXT);
		expect(env.files()['/opt/secrets/hermes.env']).toBe(ENV_TEXT);
	});
});

describe('H3: the key variable is free or ours', () => {
	test('H3: another server referencing ${MCP_ANYTYPE_API_KEY}: manual, apply refused, both files unchanged', async () => {
		const text = CONFIG_TEXT.replace('mcp_servers:\n', `mcp_servers:\n  personal:\n    url: http://127.0.0.1:31009/mcp/full\n    headers:\n      Authorization: ${HEADER}\n`);
		const envText = `${ENV_TEXT}MCP_ANYTYPE_API_KEY=old-personal\n`;
		const env = mac({ files: { [CONFIG]: text, [ENV]: envText } });
		const svc = service(env);
		const p: any = await svc.plan(plan());

		expect(p).toMatchObject({ canApply: false, note: 'aiConnectHermesVariable' });
		expect(snippets(p)).toEqual(ALT_SNIPPETS);
		expect(await svc.apply(apply())).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(env.files()[CONFIG]).toBe(text);
		expect(env.files()[ENV]).toBe(envText);

		// The reference alone (no value yet) blocks too
		overwrite(env, ENV, ENV_TEXT);
		expect(await svc.plan(plan())).toMatchObject({ canApply: false, note: 'aiConnectHermesVariable' });
	});

	test('H3: a foreign value with no anytype entry: manual', async () => {
		const env = mac({ files: { [CONFIG]: CONFIG_TEXT, [ENV]: `${ENV_TEXT}MCP_ANYTYPE_API_KEY=someone\n` } });

		expect(await service(env).plan(plan())).toMatchObject({ canApply: false, note: 'aiConnectHermesVariable' });
	});

	test('H3: the value changes between the snapshot and the write: no overwrite', async () => {
		const env = mac({ files: { [CONFIG]: CONFIG_TEXT, [ENV]: ENV_TEXT } });
		const svc = service(env);
		const writeFile = env.writeFile.bind(env);
		let done = false;

		env.writeFile = (p: string, data: any, mode: number) => {
			// The temp for our .env write is being staged: someone else saves the variable first
			if (!done && p.startsWith(`${HOME}/`) && (p != ENV) && p.includes('.env')) {
				done = true;
				overwrite(env, ENV, `${ENV_TEXT}MCP_ANYTYPE_API_KEY=someone\n`);
			};
			return writeFile(p, data, mode);
		};

		expect(await svc.apply(apply())).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(readEnvVar(env.files()[ENV], 'MCP_ANYTYPE_API_KEY')).toBe('someone');
		expect(env.files()[CONFIG]).toBe(CONFIG_TEXT);
	});

	test('H3: the binding removed right before the YAML rename: observedInstalled false', async () => {
		const env = mac({ files: { [CONFIG]: CONFIG_TEXT, [ENV]: ENV_TEXT } });
		const svc = service(env);

		onRename(env, to => {
			if (to == CONFIG) {
				overwrite(env, ENV, ENV_TEXT);
			};
		});

		expect(await svc.apply(apply())).toMatchObject({ ok: true, connection: { observedInstalled: false } });
	});
});

describe('H4: .env edits touch only our line and leave no copies', () => {
	test('H4: a token rotated meanwhile survives the rollback of a failed YAML write; no backup copies anywhere', async () => {
		const env = mac({ files: { [CONFIG]: CONFIG_TEXT, [ENV]: 'OTHER=one\n' } });
		const svc = service(env);

		onRename(env, to => {
			if (to == CONFIG) {
				overwrite(env, ENV, `OTHER=two\nMCP_ANYTYPE_API_KEY=${KEY_A}\n`);
				throw Object.assign(new Error('EACCES'), { code: 'EACCES' });
			};
		});

		expect(await svc.apply(apply())).toMatchObject({ ok: false });
		expect(env.files()[ENV]).toBe('OTHER=two\n');
		expect(env.files()[CONFIG]).toBe(CONFIG_TEXT);
		expect(Object.keys(env.files()).filter(f => f.startsWith(`${ENV}.`))).toEqual([]);
	});

	test('H4: a multiline quoted value: manual, and the file is byte-identical', async () => {
		const envText = 'NOTES="first line\nMCP_ANYTYPE_API_KEY=x\nlast line"\nOTHER=1\n';
		const env = mac({ files: { [CONFIG]: CONFIG_TEXT, [ENV]: envText } });
		const svc = service(env);

		expect(await svc.plan(plan())).toMatchObject({ canApply: false, method: 'manual' });
		expect(await svc.apply(apply())).toMatchObject({ ok: false });
		expect(env.files()[ENV]).toBe(envText);
		expect(env.files()[CONFIG]).toBe(CONFIG_TEXT);
		expect(setEnvVar(envText, 'MCP_ANYTYPE_API_KEY', 'k')).toEqual({ ok: false, category: 'unsupportedForm' });
	});
});

describe('H7: a key line that stays after disconnect is reported', () => {
	test('H7: only the .env write fails: ok, left envKey (revocation proceeds)', async () => {
		const env = mac({ files: { [CONFIG]: CONFIG_TEXT, [ENV]: ENV_TEXT } });
		const svc = service(env);

		await svc.apply(apply());
		onRename(env, to => {
			if (to == ENV) {
				throw Object.assign(new Error('EACCES'), { code: 'EACCES' });
			};
		});

		expect(await svc.remove({ accountId: 'acc-a', connectionId: 'hermes', expectedHash: 'hash-a1' })).toMatchObject({ ok: true, connection: { left: 'envKey' } });
		expect(env.files()[CONFIG]).toBe(CONFIG_TEXT);
		expect(readEnvVar(env.files()[ENV], 'MCP_ANYTYPE_API_KEY')).toBe(KEY_A);
	});
});

describe('Hermes: an anytype entry Anytype didn\'t write is never touched', () => {
	const GATEWAY_ENTRY = { url: 'http://127.0.0.1:31012/mcp/full', headers: { Authorization: 'Bearer ${ANYTYPE_API_KEY}' } };
	const GATEWAY = CONFIG_TEXT.replace(`    - '@modelcontextprotocol/server-github'\n`, `    - '@modelcontextprotocol/server-github'\n  anytype:\n    url: ${GATEWAY_ENTRY.url}\n    headers:\n      Authorization: Bearer \${ANYTYPE_API_KEY}\n`);
	const BOT_ENV = `${ENV_TEXT}ANYTYPE_API_KEY=bot-key\n`;

	test('H21: the gateway\'s bot entry: manual with anytype_me, no Replace; apply refused even with its exact digest', async () => {
		const env = mac({ files: { [CONFIG]: GATEWAY, [ENV]: BOT_ENV } });
		const svc = service(env);
		const p: any = await svc.plan(plan());

		expect(p).toMatchObject({ ok: true, canApply: false, method: 'manual', note: 'aiConnectHermesGateway', error: { stage: 'validate', category: 'conflict' } });
		expect(p.replace).toBeUndefined();
		expect(snippets(p)).toEqual(ALT_SNIPPETS);

		const digest = canonicalDigest(GATEWAY_ENTRY);

		expect(digest).toMatch(/^[0-9a-f]{64}$/);
		expect(await svc.apply(apply({ replace: { targetPath: CONFIG, foreignDigest: digest } }))).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(env.files()[CONFIG]).toBe(GATEWAY);
		expect(env.files()[ENV]).toBe(BOT_ENV);
	});

	test('a stdio entry is the gateway\'s too; one in our shape with someone else\'s key is "added by hand"', async () => {
		expect(gatewayEntry({ command: 'npx', args: [ '-y', '@anyproto/anytype-mcp' ] })).toBe(true);
		expect(gatewayEntry({ url: 'http://127.0.0.1:31012/mcp/full' })).toBe(true);
		expect(gatewayEntry({ url: URL })).toBe(false);

		const hand = CONFIG_TEXT.replace(`    - '@modelcontextprotocol/server-github'\n`, `    - '@modelcontextprotocol/server-github'\n${OUR_LINES}`);
		const env = mac({ files: { [CONFIG]: hand, [ENV]: `${ENV_TEXT}MCP_ANYTYPE_API_KEY=someone-elses\n` } });
		const svc = service(env);

		expect(await svc.plan(plan())).toMatchObject({ canApply: false, note: 'aiConnectHermesForeign' });
		expect(await svc.apply(apply())).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(readEnvVar(env.files()[ENV], 'MCP_ANYTYPE_API_KEY')).toBe('someone-elses');
	});
});

describe('H8: manual Hermes: the .env is made private', () => {
	test('H8: a 0644 .env is tightened after "I\'ve updated Hermes"; another user\'s is reported loose', async () => {
		const manual = { accountId: 'acc-a', appId: 'hermes', route: 'http', tier: 'full', recommendedTier: 'full', port: 31009, appHash: 'hash-m1', name: 'Hermes', grant: { spaceIds: [], allSpaces: true, perm: 1 }, expireAt: 0, expectedHash: null, previewTarget: CONFIG };
		const env = mac({ files: { [CONFIG]: CONFIG_TEXT, [ENV]: `${ENV_TEXT}MCP_ANYTYPE_ME_API_KEY=k\n` }, modes: { [ENV]: 0o644 } });

		expect(await service(env).recordManual(manual)).toMatchObject({ ok: true, fileMode: 'tightened' });
		expect(env.modeOf(ENV)).toBe(0o600);
		expect(env.modeOf(CONFIG)).not.toBe(0o600);

		const other = mac({ files: { [CONFIG]: CONFIG_TEXT, [ENV]: ENV_TEXT }, modes: { [ENV]: 0o644 } });
		const lstat = other.lstat;

		other.lstat = p => {
			const st = lstat(p);
			return (st && (p == ENV)) ? { ...st, uid: 0 } : st;
		};
		expect(await service(other).recordManual(manual)).toMatchObject({ ok: true, fileMode: 'loose' });
		expect(other.modeOf(ENV)).toBe(0o644);
	});
});

describe('H9: unknown ownership is never guessed', () => {
	test('H9: a config with an alias and the gateway\'s anytype: manual steps use anytype_me, never `  anytype:`', async () => {
		const text = 'defaults: &d\n  timeout: 30\nmcp_servers:\n  anytype:\n    url: http://127.0.0.1:31012/mcp/full\n    extra: *d\n';
		const env = mac({ files: { [CONFIG]: text, [ENV]: ENV_TEXT } });
		const p: any = await service(env).plan(plan());

		expect(p).toMatchObject({ canApply: false, method: 'manual' });
		expect(snippets(p)).toEqual(ALT_SNIPPETS);
		expect(snippets(p).join('\n')).not.toContain('\n  anytype:\n');
	});
});

describe('H18: Open follows the detected launch target', () => {
	test('H18: a CLI-only Hermes can\'t be opened; Antigravity with its bundle can', async () => {
		const { toDetection } = await import('../detect');
		const cliOnly = (await detectAll(mac({ shell: { hermes: '/Users/me/.local/bin/hermes' }, files: { '/Users/me/.local/bin/hermes': '' } }))).items.find(it => it.appId == 'hermes');
		const bundle = (await detectAll(mac({ apps: [ 'Antigravity' ] }))).items.find(it => it.appId == 'antigravity');

		expect(toDetection(cliOnly, undefined, 'darwin').canOpen).toBeUndefined();
		expect(toDetection(bundle, undefined, 'darwin').canOpen).toBe(true);
		expect(toDetection(bundle, undefined, 'linux').canOpen).toBeUndefined();
	});
});

describe('J1: a failed rollback keeps the new key as a candidate', () => {
	const ENOSPC = () => Object.assign(new Error('ENOSPC'), { code: 'ENOSPC' });

	test('J1: every write after the .env one fails: unconfirmed, both hashes kept; a later check settles on what .env binds; a clean rollback is a plain failure', async () => {
		const env = mac({ files: { [CONFIG]: CONFIG_TEXT, [ENV]: ENV_TEXT } });
		const svc = service(env);
		let envWritten = false;

		await svc.apply(apply());

		const off = onRename(env, to => {
			if (envWritten) {
				throw ENOSPC();
			};
			envWritten = (to == ENV);
		});

		const res: any = await svc.apply(apply({ key: KEY_B, appHash: 'hash-b1', expectedHash: 'hash-a1' }));

		expect(res).toMatchObject({ ok: false, unconfirmed: true, connection: { appHash: 'hash-a1', revokePending: [] } });
		expect(res.connection.unconfirmed.map((c: any) => c.appHash)).toEqual([ 'hash-b1' ]);
		expect(readEnvVar(env.files()[ENV], 'MCP_ANYTYPE_API_KEY')).toBe(KEY_B);

		// Unclassifiable .env: nothing settles
		off();

		const bytes = env.files()[ENV];

		overwrite(env, ENV, `${bytes}export BROKEN=1\n`);
		const waiting: any = await svc.check({ accountId: 'acc-a', apiListening: true, port: 31009, keys: keysOf([ 'hash-a1', 'hash-b1' ]) });

		expect(waiting.connections[0]).toMatchObject({ appHash: 'hash-a1', revokePending: [] });
		expect(waiting.connections[0].unconfirmed.map((c: any) => c.appHash)).toEqual([ 'hash-b1' ]);

		// .env binds B: B is promoted, only A is queued
		overwrite(env, ENV, bytes);
		const settled: any = await svc.check({ accountId: 'acc-a', apiListening: true, port: 31009, keys: keysOf([ 'hash-a1', 'hash-b1' ]) });

		expect(settled.connections[0]).toMatchObject({ appHash: 'hash-b1', revokePending: [ 'hash-a1' ] });

		// Only the config rename fails: .env goes back to its exact bytes, a plain failure
		const env2 = mac({ files: { [CONFIG]: CONFIG_TEXT, [ENV]: ENV_TEXT } });

		onRename(env2, to => {
			if (to == CONFIG) {
				throw ENOSPC();
			};
		});
		expect(await service(env2).apply(apply())).toMatchObject({ ok: false });
		expect(env2.files()[ENV]).toBe(ENV_TEXT);
	});
});

describe('J2: .env accepts plain lines only; an edit touches only our line', () => {
	test('J2: unusual .env files go manual and stay byte-identical; plain ones change by exactly our line', async () => {
		for (const envText of [
			'NOTES=\'it\\\'s a note\nMCP_ANYTYPE_API_KEY=\nend\'\n',
			'\'NOTES\'=\'multi\nMCP_ANYTYPE_API_KEY=\nend\'\n',
			'export OTHER=1\n',
			'OTHER = 1\n',
			'SERVICE_TOKEN=${MCP_ANYTYPE_API_KEY}\n',
			'A=one\nB=two\r\n',
		]) {
			const env = mac({ files: { [CONFIG]: CONFIG_TEXT, [ENV]: envText } });
			const svc = service(env);
			const p: any = await svc.plan(plan());

			expect(p).toMatchObject({ canApply: false, method: 'manual' });
			expect(snippets(p)[0]).toBe('MCP_ANYTYPE_ME_API_KEY=<KEY>');
			expect(await svc.apply(apply())).toMatchObject({ ok: false });
			expect(env.files()[ENV]).toBe(envText);
		};

		for (const envText of [ 'A=1\nB="two words" # note\n', 'A=1\r\nB=2\r\n', 'A=1\nB=2' ]) {
			const env = mac({ files: { [CONFIG]: CONFIG_TEXT, [ENV]: envText } });
			const svc = service(env);
			const eol = envText.includes('\r\n') ? '\r\n' : '\n';

			expect(await svc.apply(apply())).toMatchObject({ ok: true });
			expect(env.files()[ENV]).toBe(envText.endsWith('\n') ? `${envText}MCP_ANYTYPE_API_KEY=${KEY_A}${eol}` : `${envText}${eol}MCP_ANYTYPE_API_KEY=${KEY_A}`);

			// Our line in the middle: a rotation replaces only its value
			const middle = `${env.files()[ENV]}${envText.endsWith('\n') ? '' : eol}LATER=1${eol}`;

			overwrite(env, ENV, middle);
			expect(await svc.apply(apply({ key: KEY_B, appHash: 'hash-b1', expectedHash: 'hash-a1' }))).toMatchObject({ ok: true });
			expect(env.files()[ENV]).toBe(middle.replace(KEY_A, KEY_B));

			await svc.remove({ accountId: 'acc-a', connectionId: 'hermes', expectedHash: 'hash-b1' });
			expect(env.files()[ENV]).toBe(middle.replace(`MCP_ANYTYPE_API_KEY=${KEY_A}${eol}`, ''));
		};
	});
});

describe('J3: the variable check runs on the snapshot each write uses', () => {
	const PERSONAL = CONFIG_TEXT.replace('mcp_servers:\n', `mcp_servers:\n  personal:\n    url: http://127.0.0.1:31020/mcp/full\n    headers:\n      Authorization: ${HEADER}\n`);

	test('J3: a server using the variable appears mid-connect: no key is left bound, config keeps exactly the user\'s edit', async () => {
		// Added when the .env rename happens: the config write refuses, the .env goes back to its bytes
		const env = mac({ files: { [CONFIG]: CONFIG_TEXT, [ENV]: ENV_TEXT } });

		onRename(env, to => {
			if ((to == ENV) && (env.files()[CONFIG] == CONFIG_TEXT)) {
				overwrite(env, CONFIG, PERSONAL);
			};
		});
		expect(await service(env).apply(apply())).toMatchObject({ ok: false });
		expect(env.files()[CONFIG]).toBe(PERSONAL);
		expect(env.files()[ENV]).toBe(ENV_TEXT);

		// Added before the .env write (seen by writeKey's own check): .env is never written
		const env2 = mac({ files: { [CONFIG]: CONFIG_TEXT, [ENV]: ENV_TEXT } });
		const readFile = env2.readFile.bind(env2);
		let envReads = 0;

		env2.readFile = (p: string, max: number) => {
			if ((p == ENV) && (++envReads == 2)) {
				overwrite(env2, CONFIG, PERSONAL);
			};
			return readFile(p, max);
		};
		expect(await service(env2).apply(apply())).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(env2.files()[ENV]).toBe(ENV_TEXT);
		expect(env2.files()[CONFIG]).toBe(PERSONAL);
	});
});

describe('J4: an unresolvable .env path gets no key', () => {
	test('J4: .env linked to a missing file outside home (its parent there or not): manual, no <KEY> step, nothing created; an absent .env still auto-applies', async () => {
		for (const dirs of [ [], [ '/Volumes/Shared' ] ]) {
			const env = mac({ files: { [CONFIG]: CONFIG_TEXT }, dirs, links: { [ENV]: '/Volumes/Shared/hermes.env' } });
			const svc = service(env);
			const p: any = await svc.plan(plan());

			expect(p).toMatchObject({ canApply: false, method: 'manual' });
			expect(JSON.stringify(p.steps)).not.toContain('<KEY>');
			expect(await svc.apply(apply())).toMatchObject({ ok: false });
			expect(env.files()['/Volumes/Shared/hermes.env']).toBeUndefined();
			expect(env.files()[CONFIG]).toBe(CONFIG_TEXT);
		};

		const fresh = mac({ files: { [CONFIG]: CONFIG_TEXT } });

		expect(await service(fresh).apply(apply())).toMatchObject({ ok: true });
		expect(fresh.files()[ENV]).toBe(`MCP_ANYTYPE_API_KEY=${KEY_A}\n`);
	});
});

describe('J7: YAML edits keep every comment; flow collections are refused', () => {
	test('J7: commented parents, flow parents and roots go manual byte-identical; a comment inside our entry blocks the heal; connect → disconnect → connect stays automatic', async () => {
		for (const text of [ 'mcp_servers: # existing setup\n', 'mcp_servers: null # keep this note\n', 'mcp_servers: { github: { url: http://a } }\n', '{ model: x }\n' ]) {
			const env = mac({ files: { [CONFIG]: text, [ENV]: ENV_TEXT } });
			const svc = service(env);
			const p: any = await svc.plan(plan());

			expect(p).toMatchObject({ canApply: false, method: 'manual' });
			expect(snippets(p)).toEqual(ALT_SNIPPETS);
			expect(await svc.apply(apply())).toMatchObject({ ok: false });
			expect(env.files()[CONFIG]).toBe(text);
			expect(env.files()[ENV]).toBe(ENV_TEXT);
		};

		// A comment the user put inside our entry: the port heal refuses, the file stays as it is
		const env = mac({ files: { [CONFIG]: 'model: x\n', [ENV]: ENV_TEXT } });
		const svc = service(env);

		await svc.apply(apply());
		expect(env.files()[CONFIG]).toBe(`model: x\nmcp_servers:\n${OUR_LINES}`);

		const commented = env.files()[CONFIG].replace(`url: ${URL}`, `url: ${URL} # mine`);

		overwrite(env, CONFIG, commented);
		await svc.check({ accountId: 'acc-a', apiListening: true, port: 31010, keys: keysOf([ 'hash-a1' ]) });
		expect(env.files()[CONFIG]).toBe(commented);

		// Connect → disconnect → connect: `mcp_servers: {}` (left by our disconnect) becomes our block again
		overwrite(env, CONFIG, `model: x\nmcp_servers:\n${OUR_LINES}`);
		await svc.remove({ accountId: 'acc-a', connectionId: 'hermes', expectedHash: 'hash-a1' });
		expect(env.files()[CONFIG]).toBe('model: x\nmcp_servers: {}\n');

		const again = mac({ files: { [CONFIG]: 'model: x\nmcp_servers: {}\n', [ENV]: ENV_TEXT } });

		expect(await service(again).apply(apply())).toMatchObject({ ok: true });
		expect(again.files()[CONFIG]).toBe(`model: x\nmcp_servers:\n${OUR_LINES}`);
	});
});
