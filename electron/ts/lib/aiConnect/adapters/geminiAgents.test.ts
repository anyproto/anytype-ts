/**
 * Gemini CLI, Antigravity and OpenCode (jsonEntry) through the real service on a fake Mac, plus the Gemini
 * desktop app's detection (its card is unsupported and listed only when the app is there).
 */
import { describe, expect, test, vi } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: () => '/nonexistent', getVersion: () => '0.0.0', getFileIcon: vi.fn(), getApplicationInfoForProtocol: vi.fn() }, shell: { openExternal: vi.fn(), showItemInFolder: vi.fn() } }));
vi.mock('electron-util', () => ({ fixPathForAsarUnpack: (p: string) => p }));

import { KEY_A, KEY_B, applyParam, keysOf, mac, planParam, service } from '../testKit';
import { detectAll } from '../detect';
import { readJson } from '../jsonFile';
import { fileLayout, versionLayout } from './opencode';
import type { Detected } from '../types';

const GEMINI = '/Users/me/.gemini/settings.json';
const ANTIGRAVITY = '/Users/me/.gemini/config/mcp_config.json';
const OPENCODE = '/Users/me/.config/opencode/opencode.json';
const OPENCODE_C = '/Users/me/.config/opencode/opencode.jsonc';
const URL = 'http://127.0.0.1:31009/mcp/full';
const AUTH = { Authorization: `Bearer ${KEY_A}` };

const json = (text: string) => ({ ...(readJson(text) as any).value });
const installed = (items: Detected[]): string[] => items.filter(it => it.installed).map(it => it.appId).sort();
const cliShell = (...names: string[]) => Object.fromEntries(names.map(n => [ n, `/opt/homebrew/bin/${n}` ]));
const cliFiles = (...names: string[]) => Object.fromEntries(names.map(n => [ `/opt/homebrew/bin/${n}`, '' ]));
const plan = (appId: string, over = {}) => planParam({ appId, tier: 'full', ...over });
const apply = (appId: string, over = {}) => applyParam({ appId, tier: 'full', recommendedTier: 'full', name: appId, ...over });

describe('detection: ~/.gemini is shared, each app by its own evidence; the Gemini app only on macOS', () => {
	test('Gemini CLI by its CLI or settings.json; Antigravity by its bundle, agy or ~/.gemini/config; OpenCode by its CLI or config dir', async () => {
		const settingsOnly = await detectAll(mac({ files: { [GEMINI]: '{}' } }));
		const configOnly = await detectAll(mac({ dirs: [ '/Users/me/.gemini/config' ] }));
		const clis = await detectAll(mac({ shell: cliShell('gemini', 'agy', 'opencode'), files: cliFiles('gemini', 'agy', 'opencode') }));
		const bundles = await detectAll(mac({ apps: [ 'Antigravity', 'Gemini' ] }));
		const opencodeDir = await detectAll(mac({ dirs: [ '/Users/me/.config/opencode' ] }));

		expect(installed(settingsOnly.items)).toEqual([ 'gemini-cli' ]);
		expect(installed(configOnly.items)).toEqual([ 'antigravity' ]);
		expect(installed(clis.items)).toEqual([ 'antigravity', 'gemini-cli', 'opencode' ]);
		expect(installed(bundles.items)).toEqual([ 'antigravity', 'gemini' ]);
		expect(bundles.items.find(it => it.appId == 'antigravity').appPath).toBe('/Applications/Antigravity.app');
		expect(installed(opencodeDir.items)).toEqual([ 'opencode' ]);
		// Targets: user scope only
		expect(clis.items.find(it => it.appId == 'gemini-cli')).toMatchObject({ targetId: 'gemini-cli', targetPaths: [ GEMINI ] });
		expect(clis.items.find(it => it.appId == 'antigravity')).toMatchObject({ targetId: 'antigravity', targetPaths: [ ANTIGRAVITY ] });
		expect(clis.items.find(it => it.appId == 'opencode')).toMatchObject({ targetId: 'opencode', targetPaths: [ OPENCODE, OPENCODE_C ] });
	});
});

describe('Gemini CLI', () => {
	test('merges { httpUrl, headers } into the shared settings.json, keeps the rest; next: a new session', async () => {
		const original = '{\n  "theme": "Dracula",\n  "selectedAuthType": "oauth-personal",\n  "mcpServers": { "other": { "command": "x" } }\n}\n';
		const env = mac({ shell: cliShell('gemini'), files: { ...cliFiles('gemini'), [GEMINI]: original } });
		const svc = service(env);
		const p: any = await svc.plan(plan('gemini-cli'));

		expect(p).toMatchObject({ ok: true, canApply: true, method: 'config', nextStep: 'newSession', targetId: 'gemini-cli', displayTarget: '~/.gemini/settings.json', sentenceKey: 'aiConnectPlanConfigSession', instructions: { newSession: 'aiConnectStepNewSession' } });
		expect(JSON.stringify(p)).not.toContain(KEY_A);

		expect(await svc.apply(apply('gemini-cli'))).toMatchObject({ ok: true, connection: { id: 'gemini-cli', nextStep: 'newSession' } });

		const doc = json(env.files()[GEMINI]);

		expect(doc.theme).toBe('Dracula');
		expect(doc.selectedAuthType).toBe('oauth-personal');
		expect({ ...doc.mcpServers.other }).toEqual({ command: 'x' });
		// The key header is there from the first request: Gemini never starts OAuth
		expect(JSON.parse(JSON.stringify(doc.mcpServers.anytype))).toEqual({ httpUrl: URL, headers: AUTH });

		await svc.remove({ accountId: 'acc-a', connectionId: 'gemini-cli', expectedHash: 'hash-a1' });
		expect(json(env.files()[GEMINI]).mcpServers.anytype).toBeUndefined();
		expect(json(env.files()[GEMINI]).theme).toBe('Dracula');
	});
});

describe('Antigravity', () => {
	test('writes { serverUrl, headers } (no httpUrl, no SSE) into ~/.gemini/config/mcp_config.json; next: reload in the MCP manager', async () => {
		const env = mac({ apps: [ 'Antigravity' ], dirs: [ '/Users/me/.gemini/config' ] });
		const svc = service(env);
		const p: any = await svc.plan(plan('antigravity'));

		expect(p).toMatchObject({ ok: true, canApply: true, nextStep: 'reloadServer', targetId: 'antigravity', displayTarget: '~/.gemini/config/mcp_config.json', sentenceKey: 'aiConnectPlanConfigMcpReload', instructions: { reloadServer: 'aiConnectStepAntigravityReload' } });
		expect(await svc.apply(apply('antigravity'))).toMatchObject({ ok: true, connection: { id: 'antigravity' } });
		expect(JSON.parse(env.files()[ANTIGRAVITY])).toEqual({ mcpServers: { anytype: { serverUrl: URL, headers: AUTH } } });
		// Gemini CLI's file is not touched
		expect(env.files()[GEMINI]).toBeUndefined();

		// A port change heals the entry in place
		const res: any = await svc.check({ accountId: 'acc-a', apiListening: true, port: 31010, keys: keysOf([ 'hash-a1' ]) });

		expect(res.ok).toBe(true);
		expect(JSON.parse(env.files()[ANTIGRAVITY]).mcpServers.anytype.serverUrl).toBe('http://127.0.0.1:31010/mcp/full');
	});
});

describe('J8: a JSON insert changes nothing outside our entry, or it is refused', () => {
	const cases: [ string, string, string, any ][] = [
		[ 'gemini-cli', GEMINI, '{\n  "theme": "Dracula",\n  "mcpServers": {\n    "other": {\n      "command": "x"\n    }\n  }\n}\n', { shell: cliShell('gemini'), files: cliFiles('gemini') } ],
		[ 'antigravity', ANTIGRAVITY, '{\n  "mcpServers": {\n    "other": {\n      "serverUrl": "http://x"\n    }\n  }\n}\n', { apps: [ 'Antigravity' ] } ],
		[ 'opencode', OPENCODE, '{\n  "$schema": "https://opencode.ai/config.json",\n  "mcp": {\n    "other": {\n      "type": "local",\n      "command": [ "x" ]\n    }\n  }\n}\n', {} ],
	];

	test('J8: app-written files gain only our lines; a comment on the insertion line goes manual with the file byte-identical', async () => {
		for (const [ appId, file, original, machine ] of cases) {
			const env = mac({ ...machine, files: { ...(machine.files || {}), [file]: original } });

			expect(await service(env).apply(apply(appId))).toMatchObject({ ok: true });

			// Our block taken out (and the comma it gave its sibling): exactly the input
			const out = env.files()[file].split('\n');
			const start = out.findIndex(l => /^\s*"anytype": \{$/.test(l));
			const end = out.findIndex((l, i) => (i > start) && (l == `${out[start].match(/^\s*/)[0]}}`));
			const rest = [ ...out.slice(0, start), ...out.slice(end + 1) ];

			rest[start - 1] = rest[start - 1].replace(/,$/, '');
			expect(start).toBeGreaterThan(0);
			expect(rest.join('\n')).toBe(original);

			const commented = original.replace('\n    }\n  }', '\n    } // keep\n  }');
			const env2 = mac({ ...machine, files: { ...(machine.files || {}), [file]: commented } });
			const svc2 = service(env2);

			expect(await svc2.plan(plan(appId))).toMatchObject({ canApply: false, method: 'manual' });
			expect(await svc2.apply(apply(appId))).toMatchObject({ ok: false });
			expect(env2.files()[file]).toBe(commented);
		};
	});
});

describe('OpenCode', () => {
	test('layouts: the file tells first, then the version', () => {
		expect(fileLayout(null)).toBe(0);
		expect(fileLayout('{ "mcp": { "servers": { "x": { "type": "local" } } } }')).toBe(2);
		expect(fileLayout('{ "mcp": { "x": { "type": "remote", "url": "http://x" } } }')).toBe(1);
		expect(fileLayout('{ "theme": "x" }')).toBe(0);
		expect(versionLayout('2.4.2\n')).toBe(2);
		expect(versionLayout('1.1.29')).toBe(1);
		expect(versionLayout('0.15.3')).toBe(1);
		expect(versionLayout('')).toBe(0);
	});

	test('v1 file: mcp.anytype with enabled and oauth: false, comments and other servers kept; next: restart', async () => {
		const original = '{\n  // my config\n  "$schema": "https://opencode.ai/config.json",\n  "mcp": {\n    // keep\n    "other": { "type": "local", "command": [ "x" ] },\n  },\n}\n';
		const env = mac({ files: { [OPENCODE]: original } });
		const svc = service(env);
		const p: any = await svc.plan(plan('opencode'));

		expect(p).toMatchObject({ ok: true, canApply: true, nextStep: 'restart', targetId: 'opencode', displayTarget: '~/.config/opencode/opencode.json', instructions: { restart: 'aiConnectStepRestartSelf' } });
		expect(await svc.apply(apply('opencode'))).toMatchObject({ ok: true });

		const text = env.files()[OPENCODE];

		expect(text).toContain('// my config');
		expect(text).toContain('// keep');
		expect(JSON.parse(JSON.stringify(json(text).mcp.anytype))).toEqual({ type: 'remote', url: URL, enabled: true, oauth: false, headers: AUTH });
	});

	test('v2 by `opencode --version` (no hints in the file): mcp.servers.anytype; a .jsonc-only config is the one edited', async () => {
		const run = (call: any) => (call.file.endsWith('/opencode') && (call.args[0] == '--version')) ? { code: 0, stdout: '2.4.2\n' } : null;
		const env = mac({ shell: cliShell('opencode'), files: { ...cliFiles('opencode'), [OPENCODE_C]: '{\n  // jsonc\n  "theme": "x"\n}\n' }, run });
		const svc = service(env);

		expect(await svc.plan(plan('opencode'))).toMatchObject({ ok: true, canApply: true, displayTarget: '~/.config/opencode/opencode.jsonc' });
		expect(await svc.apply(apply('opencode'))).toMatchObject({ ok: true, connection: { targetPath: OPENCODE_C } });
		expect(env.files()[OPENCODE]).toBeUndefined();

		const doc = json(env.files()[OPENCODE_C]);

		expect(env.files()[OPENCODE_C]).toContain('// jsonc');
		expect(doc.mcp.anytype).toBeUndefined();
		expect(JSON.parse(JSON.stringify(doc.mcp.servers.anytype))).toEqual({ type: 'remote', url: URL, oauth: false, headers: AUTH });

		// Removal finds the entry where it is and leaves the rest
		await svc.remove({ accountId: 'acc-a', connectionId: 'opencode', expectedHash: 'hash-a1' });
		expect(json(env.files()[OPENCODE_C]).mcp?.servers?.anytype).toBeUndefined();
		expect(json(env.files()[OPENCODE_C]).theme).toBe('x');
	});

	test('J6: a rotation writes where the owned entry is, even with a v2 server named `type`', async () => {
		expect(fileLayout('{ "mcp": { "servers": { "type": { "type": "local", "command": [ "x" ] }, "anytype": {} } } }')).toBe(2);
		expect(fileLayout('{ "mcp": { "servers": { "type": "remote", "url": "http://x" } } }')).toBe(1);
		expect(fileLayout('{ "mcp": { "x": { "type": "other" } } }')).toBe(0);

		const run = (call: any) => (call.file.endsWith('/opencode') && (call.args[0] == '--version')) ? { code: 0, stdout: '2.4.2\n' } : null;
		const env = mac({ shell: cliShell('opencode'), files: { ...cliFiles('opencode'), [OPENCODE]: '{}\n' }, run });
		const svc = service(env);

		expect(await svc.apply(apply('opencode'))).toMatchObject({ ok: true });

		const doc = JSON.parse(env.files()[OPENCODE]);

		doc.mcp.servers.type = { type: 'local', command: [ 'other' ] };
		env.unlink(OPENCODE);
		env.writeFile(OPENCODE, JSON.stringify(doc, null, 2) + '\n', 0o600);

		const res: any = await svc.apply(apply('opencode', { key: KEY_B, appHash: 'hash-b1', expectedHash: 'hash-a1' }));
		const after = JSON.parse(env.files()[OPENCODE]);

		expect(res).toMatchObject({ ok: true, connection: { appHash: 'hash-b1', revokePending: [ 'hash-a1' ] } });
		expect(after.mcp.servers.anytype.headers.Authorization).toBe(`Bearer ${KEY_B}`);
		expect(after.mcp.anytype).toBeUndefined();
		expect(after.mcp.servers.type).toEqual({ type: 'local', command: [ 'other' ] });
	});

	test('J5: a malformed opencode.jsonc gives a manual plan that still names the file', async () => {
		const env = mac({ dirs: [ '/Users/me/.config/opencode' ], files: { [OPENCODE_C]: '{ "mcp": ' } });

		expect(await service(env).plan(plan('opencode'))).toMatchObject({ canApply: false, method: 'manual', targetPath: OPENCODE_C });
	});

	test('H10: OpenCode writes only the previewed file: .json appearing after a .jsonc preview means changed', async () => {
		const run = (call: any) => (call.file.endsWith('/opencode') && (call.args[0] == '--version')) ? { code: 0, stdout: '2.4.2\n' } : null;
		const env = mac({ shell: cliShell('opencode'), files: { ...cliFiles('opencode'), [OPENCODE_C]: '{}\n' }, run });
		const svc = service(env);
		const p: any = await svc.plan(plan('opencode'));

		expect(p.targetPath).toBe(OPENCODE_C);
		env.writeFile(OPENCODE, '{}\n', 0o600);

		expect(await svc.apply(apply('opencode', { previewTarget: OPENCODE_C }))).toMatchObject({ ok: false, error: { category: 'changed' } });
		expect(env.files()[OPENCODE]).toBe('{}\n');
		expect(env.files()[OPENCODE_C]).toBe('{}\n');
	});

	test('H11: the version can\'t be told (no CLI, nothing in the file): set up by hand with both layouts, nothing written', async () => {
		const env = mac({ dirs: [ '/Users/me/.config/opencode' ] });
		const svc = service(env);
		const p: any = await svc.plan(plan('opencode'));

		expect(p).toMatchObject({ ok: true, canApply: false, method: 'manual', error: { category: 'cliTooOld' } });
		// H11: check the version, then both layouts, labelled
		expect(p.steps.map((s: any) => s.textKey)).toEqual([ 'aiConnectManualOpencodeVersion', 'aiConnectManualOpen', 'aiConnectManualOpencodeV1', 'aiConnectManualOpencodeV2' ]);
		expect(p.steps[0].snippet).toBe('opencode --version');
		expect(JSON.parse(p.steps[2].snippet.replace('<KEY>', 'k')).mcp.anytype).toMatchObject({ type: 'remote', enabled: true, oauth: false });
		expect(JSON.parse(p.steps[3].snippet.replace('<KEY>', 'k')).mcp.servers.anytype).toMatchObject({ type: 'remote', oauth: false });
		expect(await svc.apply(apply('opencode'))).toMatchObject({ ok: false, error: { category: 'cliTooOld' } });
		expect(env.files()[OPENCODE]).toBeUndefined();
	});
});
