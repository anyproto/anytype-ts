import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	isolated: false,
	setPassword: vi.fn(),
	getPassword: vi.fn(async () => 'phrase'),
	deletePassword: vi.fn(),
}));

vi.mock('./lib/isolateDev', () => ({ isIsolatedDev: () => mocks.isolated }));
vi.mock('keytar', () => ({
	default: {
		setPassword: mocks.setPassword,
		getPassword: mocks.getPassword,
		deletePassword: mocks.deletePassword,
	},
}));

// Everything api.ts drags in that has nothing to do with the keychain
vi.mock('electron', () => ({
	app: { getVersion: () => '0.0.0', getPath: () => '/tmp', isPackaged: false, on: vi.fn() },
	shell: { openExternal: vi.fn(), showItemInFolder: vi.fn() },
	BrowserWindow: class {},
	Menu: { buildFromTemplate: vi.fn(), setApplicationMenu: vi.fn() },
	Notification: class {},
	ipcMain: { on: vi.fn(), handle: vi.fn() },
	session: { defaultSession: {} },
	clipboard: { writeText: vi.fn(), readText: () => '' },
}));
vi.mock('electron-util', () => ({ is: { macos: true, windows: false, linux: false, development: false } }));
vi.mock('electron-dl', () => ({ download: vi.fn() }));
vi.mock('check-disk-space', () => ({ default: async () => ({ free: 0, size: 0 }) }));
vi.mock('./download', () => ({ default: {} }));
vi.mock('./menu', () => ({ default: {} }));
vi.mock('./config', () => ({ default: { config: {} } }));
vi.mock('./window', () => ({ default: { sendToAllTabs: vi.fn(), list: [] } }));
vi.mock('./update', () => ({ default: {} }));
vi.mock('./server', () => ({ default: {} }));
vi.mock('./util', () => ({ default: { log: vi.fn(), send: vi.fn() } }));
vi.mock('./safeStorage', () => ({ getSafeStorage: () => ({}) }));
vi.mock('./linkApproval', () => ({ default: class { approve () {}; decide () {}; } }));

import Api from './api';

const win = {} as any;

beforeEach(() => {
	vi.clearAllMocks();
	mocks.isolated = false;
});

describe('keychain service', () => {
	test('uses "Anytype" outside isolated dev runs', async () => {
		Api.keytarSet(win, 'account', 'phrase');
		await Api.keytarGet(win, 'account');
		Api.keytarDelete(win, 'account');

		expect(mocks.setPassword).toHaveBeenCalledWith('Anytype', 'account', 'phrase');
		expect(mocks.getPassword).toHaveBeenCalledWith('Anytype', 'account');
		expect(mocks.deletePassword).toHaveBeenCalledWith('Anytype', 'account');
	});

	test('uses "Anytype Dev" in isolated dev runs, never the installed app\'s items', async () => {
		mocks.isolated = true;

		Api.keytarSet(win, 'account', 'phrase');
		await Api.keytarGet(win, 'account');
		Api.keytarDelete(win, 'account');

		expect(mocks.setPassword).toHaveBeenCalledWith('Anytype Dev', 'account', 'phrase');
		expect(mocks.getPassword).toHaveBeenCalledWith('Anytype Dev', 'account');
		expect(mocks.deletePassword).toHaveBeenCalledWith('Anytype Dev', 'account');
	});
});
