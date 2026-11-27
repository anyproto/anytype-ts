import { describe, expect, test, vi } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: () => '/nonexistent', getVersion: () => '0.0.0', getFileIcon: vi.fn(), getApplicationInfoForProtocol: vi.fn() }, shell: { openExternal: vi.fn(), showItemInFolder: vi.fn() } }));
vi.mock('electron-util', () => ({ fixPathForAsarUnpack: (p: string) => p }));

import { KEY_A, KEY_B, REGISTRY, applyParam, mac, planParam, service } from '../testKit';
import { externalAllowed } from '../index';
import { deeplink } from './lmstudio';
import { fakeEnv } from '../testEnv';
import type { AiRecord } from '../types';

const FILE = '/Users/me/.lmstudio/mcp.json';
const APP = '/Applications/LM Studio.app';

/** LM Studio installed; its `lmstudio:` handler at `handler`; openExternal recorded (and answering `opens`) */
const machine = (opt: { handler?: string; files?: Record<string, string>; opens?: boolean } = {}) => {
	const env = mac({ apps: [ 'LM Studio' ], dirs: [ '/Users/me/.lmstudio' ], files: opt.files });
	const opened: string[] = [];

	env.protocolHandler = async scheme => (scheme == 'lmstudio') ? { name: 'LM Studio', path: opt.handler ?? APP } : null;
	env.openExternal = async url => {
		opened.push(url);
		return opt.opens ?? true;
	};
	return { env, opened, svc: service(env) };
};

const lm = (over: Record<string, any> = {}) => applyParam({ appId: 'lmstudio', name: 'LM Studio', tier: 'small', recommendedTier: 'small', ...over });

describe('LM Studio', () => {
	test('the deeplink carries the entry base64-encoded; only lmstudio:// may be opened', () => {
		const url = deeplink(31009, 'small', KEY_A);
		const config = new URL(url).searchParams.get('config');

		expect(url.startsWith('lmstudio://add_mcp?name=anytype&config=')).toBe(true);
		expect(JSON.parse(Buffer.from(config, 'base64').toString('utf8'))).toEqual({ url: 'http://127.0.0.1:31009/mcp/small', headers: { Authorization: `Bearer ${KEY_A}` } });
		expect(externalAllowed(url)).toBe(true);
		expect(externalAllowed('https://lmstudio.ai/install-mcp?x')).toBe(false);
		expect(externalAllowed('file:///etc/passwd')).toBe(false);
	});

	test('first install through the detected LM Studio: deeplink (the commit), pending until the expected entry appears', async () => {
		const { env, opened, svc } = machine();

		expect(await svc.plan(planParam({ appId: 'lmstudio', tier: 'small' }))).toMatchObject({ ok: true, method: 'deeplink', nextStep: 'confirmInApp', instructions: { confirmInApp: 'aiConnectHintLmstudio' } });

		const res: any = await svc.apply(lm());

		expect(res).toMatchObject({ ok: true, connection: { method: 'deeplink', nextStep: 'confirmInApp', targetPath: FILE, observedInstalled: false, status: 'pending' } });
		expect(opened).toEqual([ deeplink(31009, 'small', KEY_A) ]);
		expect(env.files()[FILE]).toBeUndefined();

		const check = async () => (await svc.check({ accountId: 'acc-a', apiListening: true, port: 31009, keys: null }) as any).connections[0].status;

		expect(await check()).toBe('pending');

		// LM Studio added another key's entry: not ours
		env.writeFile(FILE, JSON.stringify({ mcpServers: { anytype: { url: 'http://127.0.0.1:31009/mcp/small', headers: { Authorization: `Bearer ${KEY_B}` } } } }), 0o600).close();
		expect(await check()).toBe('conflict');

		env.unlink(FILE);
		env.writeFile(FILE, JSON.stringify({ mcpServers: { anytype: { url: 'http://127.0.0.1:31009/mcp/small', headers: { Authorization: `Bearer ${KEY_A}` } } } }), 0o600).close();
		expect(await check()).toBe('ok');
	});

	test('the file fallback after a deeplink, with the same key: file route, nothing added to revokePending', async () => {
		const { env, opened, svc } = machine();

		await svc.apply(lm());

		const res: any = await svc.apply(lm({ method: 'config', expectedHash: 'hash-a1' }));

		expect(res).toMatchObject({ ok: true, connection: { method: 'config', nextStep: 'toggle', revokePending: [] } });
		expect(opened).toHaveLength(1);
		expect(JSON.parse(env.files()[FILE]).mcpServers.anytype.headers.Authorization).toBe(`Bearer ${KEY_A}`);
	});

	test('file route when the handler is another app, when an entry exists, or when a record exists', async () => {
		const elsewhere = machine({ handler: '/Users/me/Downloads/LM Studio.app' });

		expect(await elsewhere.svc.plan(planParam({ appId: 'lmstudio' }))).toMatchObject({ method: 'config', nextStep: 'toggle' });
		expect(await elsewhere.svc.apply(lm())).toMatchObject({ ok: true, connection: { method: 'config' } });
		expect(elsewhere.opened).toEqual([]);

		const entry = machine({ files: { [FILE]: JSON.stringify({ mcpServers: { anytype: { url: 'http://127.0.0.1:1/mcp/small', headers: { Authorization: `Bearer ${KEY_B}` } } } }) } });

		expect(await entry.svc.plan(planParam({ appId: 'lmstudio' }))).toMatchObject({ method: 'config', existing: 'foreign' });
		expect(await entry.svc.apply(lm())).toMatchObject({ ok: false, error: { category: 'conflict' } });
		expect(entry.opened).toEqual([]);

		const again = machine();

		await again.svc.apply(lm({ method: 'config' }));
		expect(await again.svc.plan(planParam({ appId: 'lmstudio' }))).toMatchObject({ method: 'config', existing: 'ours' });
		expect(again.opened).toEqual([]);
	});

	test('a failed open commits nothing: an open error, no record', async () => {
		const { env, svc } = machine({ opens: false });

		expect(await svc.apply(lm())).toEqual({ ok: false, error: { stage: 'open', category: 'unknown' } });
		expect(env.readText(REGISTRY)).toBeNull();
		expect(((await svc.list({ accountId: 'acc-a' })) as any).connections as AiRecord[]).toEqual([]);
	});
});

describe('LM Studio on Windows (T18)', () => {
	test('no deeplink on Windows (no verified LM Studio executable to compare the handler with): the file route, nothing opened', async () => {
		const env = fakeEnv({ platform: 'win32', home: 'C:\\Users\\me', dirs: [ 'C:\\Users\\me\\.lmstudio', 'C:\\Users\\me\\AppData\\Roaming\\anytype' ] });
		const opened: string[] = [];

		env.protocolHandler = async () => ({ name: 'LM Studio', path: 'C:\\Users\\me\\AppData\\Local\\Programs\\LM Studio\\LM Studio.exe' });
		env.openExternal = async url => {
			opened.push(url);
			return true;
		};

		const svc = service(env, 'C:\\Users\\me\\AppData\\Roaming\\anytype\\aiConnect.json');

		expect(await svc.plan(planParam({ appId: 'lmstudio' }))).toMatchObject({ ok: true, method: 'config', nextStep: 'toggle' });
		expect(await svc.apply(lm())).toMatchObject({ ok: true, connection: { method: 'config' } });
		expect(opened).toEqual([]);
		expect(env.files()['C:\\Users\\me\\.lmstudio\\mcp.json']).toContain(KEY_A);
	});
});
