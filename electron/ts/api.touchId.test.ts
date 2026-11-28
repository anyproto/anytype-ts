import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	start: vi.fn(),
	cancel: vi.fn(),
	download: vi.fn(async () => {}),
	available: vi.fn(() => true),
	prompt: vi.fn(async () => {}),
	password: vi.fn(async () => 'pin-hash'),
	store: new Map<string, any>(),
	macos: true,
	view: { webContents: { isDestroyed: () => false } },
}));

vi.mock('./download', () => ({
	default: {
		start: mocks.start,
		cancel: mocks.cancel,
	},
}));

vi.mock('electron-dl', () => ({ download: mocks.download }));

// Keep the real PIN lifecycle while isolating unrelated desktop services.
vi.mock('electron', () => ({
	systemPreferences: { canPromptTouchID: mocks.available, promptTouchID: mocks.prompt },
	app: { getVersion: () => '0.0.0', getPath: () => '/tmp', isPackaged: false, on: vi.fn() },
	shell: { openExternal: vi.fn(), showItemInFolder: vi.fn() },
	BrowserWindow: class {},
	Menu: { buildFromTemplate: vi.fn(), setApplicationMenu: vi.fn() },
	Notification: class {},
	ipcMain: { on: vi.fn(), handle: vi.fn() },
	session: { defaultSession: {} },
	clipboard: { writeText: vi.fn(), readText: () => '' },
}));
vi.mock('electron-util', () => ({ is: { get macos () { return mocks.macos; }, windows: false, linux: false, development: false } }));
vi.mock('keytar', () => ({ default: { getPassword: mocks.password, setPassword: vi.fn(), deletePassword: vi.fn() } }));
vi.mock('check-disk-space', () => ({ default: async () => ({ free: 0, size: 0 }) }));
vi.mock('./menu', () => ({ default: {} }));
vi.mock('./config', () => ({ default: { config: {} } }));
vi.mock('./window', () => ({ default: { sendToAllTabs: vi.fn(), list: [] } }));
vi.mock('./update', () => ({ default: {} }));
vi.mock('./server', () => ({ default: {} }));
vi.mock('./util', () => ({ default: { log: vi.fn(), send: vi.fn(), translate: () => 'unlock Anytype', getActiveView: () => mocks.view } }));
vi.mock('./safeStorage', () => ({ getSafeStorage: () => mocks.store }));
vi.mock('./linkApproval', () => ({ default: class { approve () {}; decide () {}; } }));

import Api from './api';

import WindowManager from './window';
import { powerState } from './lib/powerState';

const key = 'account-pin';
const win = { isFocused: () => true, isDestroyed: () => false } as any;

beforeEach(() => {
	vi.restoreAllMocks();
	vi.clearAllMocks();
	mocks.store.clear();
	mocks.store.set(`touchId-${key}`, true);
	mocks.macos = true;
	mocks.available.mockReturnValue(true);
	mocks.password.mockResolvedValue('pin-hash');
	mocks.prompt.mockResolvedValue();
	Api.isPinChecked = false;
	Api.hasPinSet = true;
	Api.touchIdPending = false;
	Api.touchIdVersion = 0;
});

describe('Touch ID', () => {
	test('is opt-in and scoped to the account PIN', () => {
		expect(Api.getTouchIdState(win, 'other-pin')).toEqual({ available: true, enabled: false });
		expect(Api.setTouchIdEnabled(win, key, true)).toBe(false);
		Api.setPinChecked(win, true, 0, true);
		expect(Api.setTouchIdEnabled(win, 'other-pin', true)).toBe(true);
		expect(Api.getTouchIdState(win, 'other-pin').enabled).toBe(true);
		expect(Api.setTouchIdEnabled(win, key, false)).toBe(true);
		expect(Api.getTouchIdState(win, key).enabled).toBe(false);
	});

	test.each([ 'unsupported', 'unavailable', 'disabled', 'unfocused', 'missing PIN', 'already unlocked' ])('does not prompt when %s', async reason => {
		if (reason == 'unsupported') { mocks.macos = false; };
		if (reason == 'unavailable') { mocks.available.mockReturnValue(false); };
		if (reason == 'disabled') { mocks.store.clear(); };
		if (reason == 'unfocused') { vi.spyOn(win, 'isFocused').mockReturnValue(false); };
		if (reason == 'missing PIN') { mocks.password.mockResolvedValue(null); };
		if (reason == 'already unlocked') { Api.isPinChecked = true; };

		expect(await Api.touchIdUnlock(win, key, 0)).toBe(false);
		expect(mocks.prompt).not.toHaveBeenCalled();
		expect(WindowManager.sendToAllTabs).not.toHaveBeenCalled();
	});

	test('unlocks all tabs and restarts the existing PIN timer only after authentication', async () => {
		const timer = vi.spyOn(Api, 'startPinTimer').mockImplementation(() => {});

		expect(await Api.touchIdUnlock(win, key, 60000)).toBe(true);
		expect(mocks.prompt).toHaveBeenCalledWith('unlock Anytype');
		expect(Api.isPinChecked).toBe(true);
		expect(timer).toHaveBeenCalledWith(win, 60000);
		expect(WindowManager.sendToAllTabs).toHaveBeenCalledWith('pin-unlocked');
	});

	test('keeps the PIN available after cancellation and allows a retry', async () => {
		mocks.prompt.mockRejectedValueOnce(new Error('User canceled'));

		expect(await Api.touchIdUnlock(win, key, 0)).toBe(false);
		expect(Api.isPinChecked).toBe(false);
		expect(WindowManager.sendToAllTabs).not.toHaveBeenCalled();
		expect(await Api.touchIdUnlock(win, key, 0)).toBe(true);
	});

	test('serializes prompts across windows', async () => {
		let resolve: () => void;
		mocks.prompt.mockReturnValueOnce(new Promise<void>(done => { resolve = done; }));
		const first = Api.touchIdUnlock(win, key, 0);
		await vi.waitFor(() => expect(mocks.prompt).toHaveBeenCalledOnce());

		expect(await Api.touchIdUnlock(win, key, 0)).toBe(false);
		expect(mocks.prompt).toHaveBeenCalledOnce();
		resolve();
		expect(await first).toBe(true);
	});

	test.each([ 'lock', 'logout', 'PIN changed', 'PIN removed', 'PIN entered', 'sleep', 'window closed' ])('ignores a successful prompt after %s', async reason => {
		let resolve: () => void;
		mocks.prompt.mockReturnValueOnce(new Promise<void>(done => { resolve = done; }));
		const result = Api.touchIdUnlock(win, key, 0);
		await vi.waitFor(() => expect(mocks.prompt).toHaveBeenCalledOnce());

		if (reason == 'lock') { Api.pinCheck(win); };
		if (reason == 'logout') { Api.logout(win); };
		if (reason == 'PIN changed') { Api.keytarSet(win, key, 'new-hash'); };
		if (reason == 'PIN removed') { Api.keytarDelete(win, key); };
		if (reason == 'PIN entered') { Api.setPinChecked(win, true, 0, true); };
		if (reason == 'sleep') { vi.spyOn(powerState, 'getSnapshot').mockReturnValue({ state: 'suspend', seq: 100, delivered: 0 }); };
		if (reason == 'window closed') { vi.spyOn(win, 'isDestroyed').mockReturnValue(true); };
		vi.mocked(WindowManager.sendToAllTabs).mockClear();

		resolve();
		expect(await result).toBe(false);
		expect(WindowManager.sendToAllTabs).not.toHaveBeenCalledWith('pin-unlocked');
	});

	test.each([ 'change', 'remove' ])('clears opt-in on PIN %s', action => {
		if (action == 'change') { Api.keytarSet(win, key, 'new-hash'); };
		if (action == 'remove') { Api.keytarDelete(win, key); };
		expect(Api.getTouchIdState(win, key).enabled).toBe(false);
	});
});
