/**
 * The endpoint file (tokens-plan §2.2, §3.2): the desktop is its only writer; it names the port only while the Local
 * API listens where 127.0.0.1 reaches it, and is gone in every other state, at start and at quit.
 */
import { describe, expect, test, vi } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: () => '/nonexistent', getAppPath: () => '/nonexistent', getVersion: () => '0.0.0', getFileIcon: vi.fn(), getApplicationInfoForProtocol: vi.fn() }, shell: { openExternal: vi.fn(), showItemInFolder: vi.fn() }, clipboard: { readText: vi.fn(), writeText: vi.fn() } }));
vi.mock('electron-util', () => ({ fixPathForAsarUnpack: (p: string) => p }));

import { ENDPOINT_DEV, FORWARDER_FILES, mac, service, type ApiSettings } from './testKit';
import { RENAME_ATTEMPTS, syncEndpoint } from './endpoint';
import { fakeEnv } from './testEnv';

const machine = () => {
	const api: ApiSettings = { localApi: { enabled: true, port: 31009 }, bind: { addr: '127.0.0.1:31009', success: true } };
	const env = mac({ files: { ...FORWARDER_FILES } });

	return { env, api, svc: service(env, undefined, api) };
};

const endpoint = (env: ReturnType<typeof mac>): any => {
	const text = env.files()[ENDPOINT_DEV];
	return (text === undefined) ? null : JSON.parse(text);
};

describe('D1-04: the endpoint file', () => {
	test('D1-04: written only while the API listens on 127.0.0.1 / 0.0.0.0; gone after API off, a failed bind, a [::1] bind, quit and right after start; an old bind for another port publishes nothing; another instance\'s port is not deleted', async () => {
		const { env, api, svc } = machine();

		await svc.apiChanged('localApiBind');
		expect(endpoint(env)).toEqual({ v: 1, port: 31009 });
		expect(env.modeOf(ENDPOINT_DEV)).toBe(0o600);

		api.bind = { addr: '0.0.0.0:31009', success: true };
		await svc.apiChanged('localApiBind');
		expect(endpoint(env)).toEqual({ v: 1, port: 31009 });

		// The API switched off (the window writes `localApi` first)
		api.localApi = { enabled: false, port: 31009 };
		await svc.apiChanged('localApi');
		expect(endpoint(env)).toBeNull();

		// A failed bind
		api.localApi = { enabled: true, port: 31009 };
		api.bind = { addr: '', success: false, error: 'address in use' };
		await svc.apiChanged('localApiBind');
		expect(endpoint(env)).toBeNull();

		// IPv6 only: 127.0.0.1 can't reach it
		api.bind = { addr: '[::1]:31009', success: true };
		await svc.apiChanged('localApiBind');
		expect(endpoint(env)).toBeNull();

		// The port was changed in the settings, heart still reports the old bind: nothing is published
		api.localApi = { enabled: true, port: 31010 };
		api.bind = { addr: '127.0.0.1:31009', success: true };
		await svc.apiChanged('localApi');
		expect(endpoint(env)).toBeNull();

		// …until heart binds the new port
		api.bind = { addr: '127.0.0.1:31010', success: true };
		await svc.apiChanged('localApiBind');
		expect(endpoint(env)).toEqual({ v: 1, port: 31010 });

		// Logout: no account, nothing published
		await svc.accountStopped();
		expect(endpoint(env)).toBeNull();
		await svc.apiChanged('localApiBind');
		expect(endpoint(env)).toEqual({ v: 1, port: 31010 });

		// Quit
		svc.shutdown();
		expect(endpoint(env)).toBeNull();

		// Another instance (the other channel, or a second profile) wrote its port: this one never deletes it
		const other = machine();

		await other.svc.apiChanged('localApiBind');
		other.env.unlink(ENDPOINT_DEV);
		other.env.writeFile(ENDPOINT_DEV, JSON.stringify({ v: 1, port: 40000 }), 0o600).close();
		other.api.localApi = { enabled: false, port: 31009 };
		await other.svc.apiChanged('localApi');
		other.svc.shutdown();
		expect(endpoint(other.env)).toEqual({ v: 1, port: 40000 });

		// App start: whatever a crashed run left is deleted, whoever wrote it
		await service(other.env).startup('/Users/me/Library/Application Support/anytype');
		expect(endpoint(other.env)).toBeNull();
	});

	test('D1-04: every check brings the file up to date first', async () => {
		const { env, api, svc } = machine();

		await svc.check({ accountId: 'acc-a', apiListening: true, port: 31009, keys: null });
		expect(endpoint(env)).toEqual({ v: 1, port: 31009 });

		api.localApi = { enabled: false, port: 31009 };
		await svc.check({ accountId: 'acc-a', apiListening: false, keys: null });
		expect(endpoint(env)).toBeNull();
	});
});

describe('the endpoint writer on Windows', () => {
	const HOME = 'C:\\Users\\me';
	const FILE = `${HOME}\\.anytype\\ai-connect\\endpoint-dev.json`;
	const state = { localApi: { enabled: true, port: 31009 }, bind: { addr: '127.0.0.1:31009', success: true }, account: true };
	/** A Windows home whose first `failures` renames onto the endpoint file fail with `code` (the forwarder holds a handle) */
	const windows = (failures: number, code = 'EPERM') => {
		const env = fakeEnv({ platform: 'win32', home: HOME, vars: { SystemRoot: 'C:\\Windows' }, dirs: [ `${HOME}\\.anytype`, `${HOME}\\.anytype\\ai-connect` ], acl: {} });
		const rename = env.rename;
		const slept: number[] = [];
		let attempts = 0;

		env.rename = (from, to) => {
			if (to == FILE) {
				attempts++;
				if (attempts <= failures) {
					throw Object.assign(new Error(code), { code });
				};
			};
			rename(from, to);
		};
		env.sleep = async ms => {
			slept.push(ms);
		};
		return { env, slept, attempts: () => attempts };
	};

	test('a rename refused with EPERM while the forwarder reads the file is retried, within ~500 ms', async () => {
		const { env, slept, attempts } = windows(3);

		expect(await syncEndpoint(env, state, null)).toBe(31009);
		expect(attempts()).toBe(4);
		expect(slept.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(500);
		expect(JSON.parse(env.files()[FILE])).toEqual({ v: 1, port: 31009 });
		expect(Object.keys(env.files()).filter(f => f.endsWith('.tmp'))).toEqual([]);
	});

	test('still refused after the last attempt: fails visibly, nothing published, no temp left', async () => {
		const { env, attempts } = windows(100, 'EBUSY');
		const logged: string[] = [];

		expect(await syncEndpoint(env, state, null, code => logged.push(code))).toBeNull();
		expect(attempts()).toBe(RENAME_ATTEMPTS);
		expect(logged).toEqual([ 'EBUSY' ]);
		expect(env.files()[FILE]).toBeUndefined();
		expect(Object.keys(env.files()).filter(f => f.endsWith('.tmp'))).toEqual([]);
	});

	test('another error, or the same one on macOS / Linux, is not retried', async () => {
		const other = windows(1, 'ENOSPC');

		expect(await syncEndpoint(other.env, state, null)).toBeNull();
		expect(other.attempts()).toBe(1);

		const env = mac({ files: { ...FORWARDER_FILES } });
		const rename = env.rename;
		let attempts = 0;

		env.rename = (from, to) => {
			if (to == ENDPOINT_DEV) {
				attempts++;
				throw Object.assign(new Error('EPERM'), { code: 'EPERM' });
			};
			rename(from, to);
		};
		expect(await syncEndpoint(env, state, null)).toBeNull();
		expect(attempts).toBe(1);
	});
});
