/**
 * Manual steps per adapter (what the manual view shows): ordered, with `<KEY>` where the key goes and
 * never a key; per OS where the OS changes them. Plus Claude Desktop's Windows profile resolution and
 * the icon cache.
 */
import { describe, expect, test, vi } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: () => '/nonexistent', getVersion: () => '0.0.0', getFileIcon: vi.fn(), getApplicationInfoForProtocol: vi.fn() }, shell: { openExternal: vi.fn(), showItemInFolder: vi.fn() } }));
vi.mock('electron-util', () => ({ fixPathForAsarUnpack: (p: string) => p }));

import { AiConnectService } from '../index';
import { MCP_DIR, REGISTRY, FORWARDER_FILES, STABLE_BIN, mac, planParam, service } from '../testKit';
import { claudeDesktopDir } from '../detect';
import { jsonFormat, tomlFormat } from './jsonEntry';
import { readToml } from '../tomlFile';
import { fakeEnv } from '../testEnv';
import type { AiStep } from '../types';

const KEY = '<KEY>';
const steps = async (svc: any, over: Record<string, any>): Promise<AiStep[]> => ((await svc.plan(planParam(over))) as any).steps;
const keyless = (s: AiStep[]) => JSON.stringify(s).includes('SENTINEL') === false;

describe('manual steps', () => {
	const env = mac({
		apps: [ 'Cursor', 'ChatGPT', 'Visual Studio Code', 'LM Studio', 'Claude' ],
		dirs: [ '/Users/me/.codex', '/Users/me/.lmstudio', '/Users/me/.claude' ],
		files: {
			...FORWARDER_FILES,
			'/Users/me/.local/bin/claude': '',
			[`${MCP_DIR}/Anytype.mcpb`]: 'zip',
		},
		shell: { claude: '/Users/me/.local/bin/claude' },
		run: call => (call.args[0] == '--version') ? { code: 0, stdout: '2.1.332\n' } : null,
	});
	const svc = service(env);

	test('JSON file cards: open the file, merge the whole document (T16)', async () => {
		for (const [ appId, file ] of [ [ 'cursor', '/Users/me/.cursor/mcp.json' ], [ 'vscode', '/Users/me/.copilot/mcp-config.json' ], [ 'lmstudio', '/Users/me/.lmstudio/mcp.json' ] ]) {
			const s = await steps(svc, { appId, method: (appId == 'lmstudio') ? 'config' : undefined });

			expect(s.map(it => it.textKey)).toEqual([ 'aiConnectManualOpen', 'aiConnectManualMerge' ]);
			expect(s[0]).toMatchObject({ path: file, args: [ file.replace('/Users/me', '~') ] });
			expect(JSON.parse(s[1].snippet).mcpServers.anytype.headers.Authorization).toBe(`Bearer ${KEY}`);
			expect(keyless(s)).toBe(true);
		};
	});

	test('ChatGPT / Codex: the TOML table, appended (T16)', async () => {
		const s = await steps(svc, { appId: 'chatgpt' });

		expect(s[1]).toMatchObject({ textKey: 'aiConnectManualAppend', lang: 'toml', snippet: `[mcp_servers.anytype]\nurl = "http://127.0.0.1:31009/mcp/large"\nhttp_headers = { Authorization = "Bearer ${KEY}" }\n` });
	});

	test('Claude Code: the env values and the skill file (skill); a keyless command reading stdin, then the entry to paste (MCP tools, T6)', async () => {
		const skill = await steps(svc, { appId: 'claude-code', route: 'skill' });
		const mcp = await steps(svc, { appId: 'claude-code', route: 'http' });

		expect(skill.map(it => it.textKey)).toEqual([ 'aiConnectManualOpen', 'aiConnectManualMerge' ]);
		expect(JSON.parse(skill[1].snippet)).toEqual({ env: { ANYTYPE_API_URL: 'http://127.0.0.1:31009', ANYTYPE_API_KEY: KEY } });
		expect(mcp).toEqual([
			{ textKey: 'aiConnectManualRun', lang: 'sh', snippet: 'claude mcp add-json --scope user anytype -' },
			{ textKey: 'aiConnectManualPasteStdin', lang: 'json', snippet: `{"type":"http","url":"http://127.0.0.1:31009/mcp/large","headers":{"Authorization":"Bearer ${KEY}"}}` },
		]);
		// The key goes only into what is pasted, never into a command line
		expect(mcp.filter(it => it.lang == 'sh').every(it => !it.snippet.includes(KEY))).toBe(true);
	});

	test('Claude Code MCP: without a CLI that reads stdin there is no paste step at all — install / update guidance only (T6, U20)', async () => {
		const old = mac({ dirs: [ '/Users/me/.claude' ], files: { '/Users/me/.local/bin/claude': '' }, shell: { claude: '/Users/me/.local/bin/claude' }, run: call => (call.args[0] == '--version') ? { code: 0, stdout: '2.1.326\n' } : null });
		const tooOld = await steps(service(old), { appId: 'claude-code', route: 'http' });

		expect(tooOld).toEqual([ { textKey: 'aiConnectManualUpdateCli', args: [ 'Claude Code', '2.1.327' ] } ]);

		const broken = mac({ dirs: [ '/Users/me/.claude' ], files: { '/Users/me/.local/bin/claude': '' }, shell: { claude: '/Users/me/.local/bin/claude' }, run: call => (call.args[0] == '--version') ? { code: 1, stdout: '' } : null });

		expect((await steps(service(broken), { appId: 'claude-code', route: 'http' })).map(it => it.textKey)).toEqual([ 'aiConnectManualUpdateCli' ]);

		// No CLI at all (here a Windows machine): install guidance, nothing to paste
		const win = fakeEnv({ platform: 'win32', home: 'C:\\Users\\me', dirs: [ 'C:\\Users\\me\\.claude', 'C:\\Users\\me\\AppData\\Roaming\\anytype' ] });
		const none = await steps(service(win, 'C:\\Users\\me\\AppData\\Roaming\\anytype\\aiConnect.json'), { appId: 'claude-code', route: 'http' });

		expect(none.map(it => it.textKey)).toEqual([ 'aiConnectManualInstallCli' ]);
		expect(JSON.stringify([ tooOld, none ])).not.toContain(KEY);
	});

	test('Claude Code MCP: with a working CLI, the keyless command comes first, then the paste (Windows ends it its own way) (U20)', async () => {
		const win = fakeEnv({
			platform: 'win32', home: 'C:\\Users\\me', vars: { SystemRoot: 'C:\\Windows' },
			dirs: [ 'C:\\Users\\me\\.claude', 'C:\\Users\\me\\AppData\\Roaming\\anytype' ], files: { 'C:\\Users\\me\\.local\\bin\\claude.exe': '' },
			run: call => /where\.exe$/i.test(call.file) ? { code: (call.args[0] == 'claude') ? 0 : 1, stdout: (call.args[0] == 'claude') ? 'C:\\Users\\me\\.local\\bin\\claude.exe\r\n' : '' } : ((call.args[0] == '--version') ? { code: 0, stdout: '2.1.332\n' } : { code: 1, stdout: '' }),
		});
		const winSteps = await steps(service(win, 'C:\\Users\\me\\AppData\\Roaming\\anytype\\aiConnect.json'), { appId: 'claude-code', route: 'http' });

		expect(winSteps.map(it => it.textKey)).toEqual([ 'aiConnectManualRun', 'aiConnectManualPasteStdinWin' ]);
		expect(winSteps[0].snippet).not.toContain(KEY);
	});

	test('following the manual steps produces a file the app (and Anytype\'s own reader) reads as the entry Anytype writes (T16)', async () => {
		const filled = (text: string) => text.split(KEY).join('SENTINEL-manual-key-0123456789');

		for (const [ appId, file ] of [ [ 'cursor', '/Users/me/.cursor/mcp.json' ], [ 'vscode', '/Users/me/.copilot/mcp-config.json' ], [ 'lmstudio', '/Users/me/.lmstudio/mcp.json' ] ]) {
			const s = await steps(svc, { appId, method: (appId == 'lmstudio') ? 'config' : undefined });
			const doc = filled(s[1].snippet);
			// The same machine, connected automatically with the same key, as the reference
			const auto = mac({ apps: [ 'Cursor', 'Visual Studio Code', 'LM Studio' ], dirs: [ '/Users/me/.lmstudio' ] });

			await service(auto).apply({ accountId: 'acc-a', appId, route: 'http', tier: 'large', recommendedTier: 'large', port: 31009, key: 'SENTINEL-manual-key-0123456789', appHash: 'h1', name: 'x', grant: { spaceIds: [], allSpaces: true, perm: 1 }, expireAt: 0, expectedHash: null, ...((appId == 'lmstudio') ? { method: 'config' } : {}) });
			// Pasted into an empty file, the snippet is the file
			expect(jsonFormat([ 'mcpServers', 'anytype' ]).read(doc).value).toEqual(JSON.parse(auto.files()[file]).mcpServers.anytype);
		};

		const toml = await steps(svc, { appId: 'chatgpt' });
		const existing = '# mine\n[profile]\nx = 1\n';

		// Appended at the end of an existing config.toml, it reads as the table Anytype writes
		expect(tomlFormat().read(existing + filled(toml[1].snippet)).value).toEqual({ url: 'http://127.0.0.1:31009/mcp/large', http_headers: { Authorization: 'Bearer SENTINEL-manual-key-0123456789' } });

		const desktop = await steps(svc, { appId: 'claude-desktop', route: 'stdio', method: 'config' });

		expect(jsonFormat([ 'mcpServers', 'anytype' ]).read(filled(desktop[0].snippet)).value).toEqual({ command: STABLE_BIN, args: [ 'serve', '--tier', 'large' ], env: { ANYTYPE_API_KEY: 'SENTINEL-manual-key-0123456789' } });
	});

	test('Claude Code skill: the manual steps include saving the marked skill where Anytype would install it (T16)', async () => {
		const built = mac({
			dirs: [ '/Users/me/.claude' ],
			files: { [`${MCP_DIR}/skill/SKILL.md`]: '---\nname: anytype-api\n---\nbody\n', [`${MCP_DIR}/skill/PREAMBLE.md`]: '<!-- anytype-desktop:begin -->\nx\n<!-- anytype-desktop:end -->\n' },
		});
		const s = await steps(service(built), { appId: 'claude-code', route: 'skill' });

		expect(s.map(it => it.textKey)).toEqual([ 'aiConnectManualOpen', 'aiConnectManualMerge', 'aiConnectManualSaveFile' ]);
		expect(s[2]).toMatchObject({ path: '/Users/me/.claude/skills/anytype-api/SKILL.md', args: [ '~/.claude/skills/anytype-api/SKILL.md' ] });
		expect(s[2].snippet).toContain('<!-- anytype-desktop:begin -->');
	});

	test('Claude Desktop (macOS): the extension route has no manual steps; the config route\'s steps add the command with the key placeholder in `env`, kept private', async () => {
		const primary = await steps(svc, { appId: 'claude-desktop', route: 'stdio', tier: 'full', method: 'package' });
		const config: any = await svc.plan({ accountId: 'acc-a', appId: 'claude-desktop', route: 'stdio', tier: 'large', port: 31009, method: 'config' });

		expect(primary).toEqual([]);
		expect(config.needsKey).toBe(true);
		expect(config.steps.map((it: AiStep) => it.textKey)).toEqual([ 'aiConnectManualMerge', 'aiConnectManualKeepPrivate', 'aiConnectStepRestartSelf' ]);
		expect(JSON.parse(config.steps[0].snippet).mcpServers.anytype).toEqual({ command: STABLE_BIN, args: [ 'serve', '--tier', 'large' ], env: { ANYTYPE_API_KEY: KEY } });
		expect(JSON.stringify(config)).not.toMatch(/ELECTRON|\.mjs|SENTINEL/);
	});

	test('Other app, URL and key: most apps, then URL / header name / header value; the Command setup is offered where the forwarder can run', async () => {
		const res: any = await svc.plan({ accountId: 'acc-a', appId: 'other', route: 'http', tier: 'large', port: 31009 });
		const macSteps = await steps(svc, { appId: 'other' });

		expect(macSteps.map(it => it.textKey)).toEqual([ 'aiConnectManualFormatMost', 'aiConnectManualUrl', 'aiConnectManualHeaderName', 'aiConnectManualHeaderValue' ]);
		expect(macSteps.slice(1).map(it => it.snippet)).toEqual([ 'http://127.0.0.1:31009/mcp/large', 'Authorization', `Bearer ${KEY}` ]);
		expect(res.setups).toEqual([ 'url', 'command' ]);
		// No step starts Anytype itself any more
		expect(JSON.stringify(macSteps)).not.toMatch(/ELECTRON|\.mjs|Anytype\.app/);

		// A build without a forwarder, and a package other apps can't start: the URL setup only
		const none = mac({});
		const snap = fakeEnv({ platform: 'linux', home: '/home/me', vars: { SNAP: '/snap/anytype/1' }, dirs: [ '/home/me/.config/anytype' ], files: { ...FORWARDER_FILES } });

		expect(((await service(none).plan({ accountId: 'acc-a', appId: 'other', route: 'http', tier: 'large', port: 31009 })) as any).setups).toEqual([ 'url' ]);
		expect(((await service(snap, '/home/me/.config/anytype/aiConnect.json').plan({ accountId: 'acc-a', appId: 'other', route: 'http', tier: 'large', port: 31009 })) as any).setups).toEqual([ 'url' ]);
	});

	test('Other app, Command: a manual plan whose snippet starts the stable copy with the key placeholder in `env` (never in the command or its arguments)', async () => {
		const res: any = await svc.plan({ accountId: 'acc-a', appId: 'other', route: 'stdio', tier: 'large', port: 31009, method: 'command' });

		expect(res).toMatchObject({ ok: true, canApply: false, method: 'manual', route: 'stdio', targetId: null, setups: [ 'url', 'command' ], needsKey: true });
		expect(res.steps.map((it: AiStep) => it.textKey)).toEqual([ 'aiConnectManualCommandEntry', 'aiConnectManualKeepPrivate', 'aiConnectManualCommandRestart' ]);
		expect(JSON.parse(res.steps[0].snippet).mcpServers.anytype).toEqual({ command: STABLE_BIN, args: [ 'serve', '--tier', 'large' ], env: { ANYTYPE_API_KEY: KEY } });
	});
});

describe('manual Codex steps follow the file\'s form (U13)', () => {
	const KEYED = 'SENTINEL-manual-key-0123456789';
	const filled = (text: string) => text.split(KEY).join(KEYED);
	const expected = { url: 'http://127.0.0.1:31009/mcp/large', http_headers: { Authorization: `Bearer ${KEYED}` } };
	const codexSteps = async (text: string) => {
		const env = mac({ apps: [ 'ChatGPT' ], dirs: [ '/Users/me/.codex' ], files: { '/Users/me/.codex/config.toml': text } });
		return steps(service(env), { appId: 'chatgpt' });
	};

	test('an existing [mcp_servers.anytype] table: replace it (never a second one); the result parses and reads as Anytype\'s entry', async () => {
		const original = '# mine\n[mcp_servers.other]\nurl = "http://x"\n\n[mcp_servers.anytype]\nurl = "http://127.0.0.1:1/mcp/large"\nhttp_headers = { Authorization = "Bearer SENTINEL-foreign-key-000000" }\n\n[profile]\nx = 1\n';
		const s = await codexSteps(original);

		expect(s[1]).toMatchObject({ textKey: 'aiConnectManualReplaceTable', args: [ '[mcp_servers.anytype]' ], lang: 'toml' });

		// Following it: the table's lines replaced by the snippet, everything else kept
		const replaced = original.replace(/\[mcp_servers\.anytype\]\n(?:[^\[\n].*\n)*/, filled(s[1].snippet));
		const appended = original + filled(s[1].snippet);

		expect(tomlFormat().read(replaced).value).toEqual(expected);
		expect(readToml(replaced).mcp_servers.other).toEqual({ url: 'http://x' });
		// What the old "append" wording would have produced is not readable
		expect(readToml(appended)).toBeNull();
	});

	test('an inline mcp_servers table: the entry goes inside it as a member; the result parses', async () => {
		const original = 'mcp_servers = { other = { url = "http://x" } }\n';
		const s = await codexSteps(original);

		expect(s[1]).toMatchObject({ textKey: 'aiConnectManualAddMember', args: [ 'anytype', 'mcp_servers' ], lang: 'toml' });

		const inside = original.replace(' }\n', `, ${filled(s[1].snippet)} }\n`);

		expect(tomlFormat().read(inside).value).toEqual(expected);
		expect(readToml(original + `[mcp_servers.anytype]\nurl = "x"\n`)).toBeNull();
	});

	test('final 8: an inline mcp_servers that already has `anytype`: replace that member (never a second one); the result parses', async () => {
		const original = 'mcp_servers = { other = { url = "http://x" }, anytype = { url = "http://127.0.0.1:1/mcp/large" } }\n';
		const s = await codexSteps(original);

		expect(s[1]).toMatchObject({ textKey: 'aiConnectManualReplaceMember', args: [ 'anytype', 'mcp_servers' ], lang: 'toml' });

		const replaced = original.replace(/anytype = \{ url = "[^"]*" \}/, filled(s[1].snippet));

		expect(tomlFormat().read(replaced).value).toEqual(expected);
		expect(readToml(original.replace(' }\n', `, ${filled(s[1].snippet)} }\n`))).toBeNull();
	});

	test('no Anytype table yet: append the complete table; the result parses', async () => {
		const original = '[mcp_servers.other]\nurl = "http://x"\n';
		const s = await codexSteps(original);

		expect(s[1]).toMatchObject({ textKey: 'aiConnectManualAppend' });
		expect(tomlFormat().read(original + '\n' + filled(s[1].snippet)).value).toEqual(expected);
	});
});

describe('Claude Desktop on Windows: the profile directory', () => {
	const local = 'C:\\Users\\me\\AppData\\Local';
	const vars = { LOCALAPPDATA: local, APPDATA: 'C:\\Users\\me\\AppData\\Roaming' };

	test.each([
		[ 'the migrated Claude-Data profile', [ `${local}\\Claude-Data\\Claude_pzs8sxrjxfjjc`, `${local}\\Packages\\Claude_pzs8sxrjxfjjc\\LocalCache\\Roaming\\Claude` ], `${local}\\Claude-Data\\Claude_pzs8sxrjxfjjc` ],
		[ 'the Claude_* package', [ `${local}\\Packages\\Claude_pzs8sxrjxfjjc\\LocalCache\\Roaming\\Claude` ], `${local}\\Packages\\Claude_pzs8sxrjxfjjc\\LocalCache\\Roaming\\Claude` ],
		[ 'the AnthropicPBC.Claude* package', [ `${local}\\Packages\\AnthropicPBC.Claude_abc\\LocalCache\\Roaming\\Claude` ], `${local}\\Packages\\AnthropicPBC.Claude_abc\\LocalCache\\Roaming\\Claude` ],
		[ 'the classic %APPDATA%\\Claude', [], 'C:\\Users\\me\\AppData\\Roaming\\Claude' ],
	])('%s', (_, dirs, expected) => {
		expect(claudeDesktopDir(fakeEnv({ platform: 'win32', home: 'C:\\Users\\me', vars, dirs }))).toBe(expected);
	});
});

describe('icons', () => {
	test('from the app bundle, cached by path; none for apps that are not installed', async () => {
		const env = mac({ apps: [ 'Cursor' ] });
		const icon = vi.fn(async () => 'data:image/png;base64,AAAA');
		const svc = new AiConnectService(() => ({ env, registryFile: REGISTRY }));

		svc.configure({ env, registryFile: REGISTRY, icon });

		const first: any = await svc.list({ accountId: 'a' });
		await svc.list({ accountId: 'a', refresh: true });

		expect(first.detections.find((d: any) => d.appId == 'cursor').icon).toBe('data:image/png;base64,AAAA');
		expect(first.detections.find((d: any) => d.appId == 'chatgpt').icon).toBeUndefined();
		expect(icon.mock.calls).toEqual([ [ '/Applications/Cursor.app' ] ]);
	});
});
