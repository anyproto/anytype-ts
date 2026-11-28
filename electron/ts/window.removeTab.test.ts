/**
 * Y1 (Connect to AI, Phase 3): closing one tab must reach that tab's renderer, whose `close-session` handler
 * revokes a key it minted and didn't deliver yet. `removeTab` drops the view from `win.views` first, so the
 * message goes to the captured view itself.
 */
import { expect, test, vi } from 'vitest';

const ipc = vi.hoisted(() => ({ handlers: [] as [ string, (...args: any[]) => void ][] }));

vi.mock('electron', () => ({
	app: { isPackaged: false, getPath: () => '/nonexistent', getVersion: () => '0.0.0', on: vi.fn() },
	BrowserWindow: class {},
	WebContentsView: class {},
	nativeImage: { createFromPath: vi.fn() },
	dialog: {},
	ipcMain: { on: (channel: string, handler: any) => ipc.handlers.push([ channel, handler ]), removeListener: vi.fn() },
}));
vi.mock('electron-util', () => ({ is: { macos: true, windows: false, linux: false, development: false }, fixPathForAsarUnpack: (p: string) => p }));
vi.mock('electron-window-state', () => ({ default: vi.fn() }));
vi.mock('@electron/remote/main', () => ({ enable: vi.fn() }));
vi.mock('./api', () => ({ default: {} }));
vi.mock('./config', () => ({ default: { config: {} } }));
vi.mock('./update', () => ({ default: {} }));
vi.mock('./menu', () => ({ default: {} }));
vi.mock('./safeStorage', () => ({ getSafeStorage: vi.fn() }));
vi.mock('./lib/trustedUrl', () => ({ getExternalUrl: vi.fn() }));
vi.mock('./util', () => ({
	default: {
		getPort: () => '',
		send: vi.fn(),
		log: vi.fn(),
		sendToAllTabs: vi.fn(),
		getActiveView: vi.fn(),
		// As util.ts does: only a view still in win.views gets the message
		sendToTab: (win: any, tabId: string, ...args: any[]) => win.views.find((v: any) => v.id == tabId)?.webContents.send(...args),
	},
}));

import WindowManager from './window';

const view = (id: string) => ({ id, data: {}, webContents: { send: vi.fn(), close: vi.fn(), isDestroyed: () => false } });

test('Y1: removeTab sends close-session to the removed tab\'s own view; its reply closes that view', () => {
	const kept = view('tab-1');
	const closing = view('tab-2');
	const win: any = { views: [ kept, closing ], activeTabId: 'tab-1', isDestroyed: () => false, contentView: { removeChildView: vi.fn() } };

	(WindowManager as any).updateTabBarVisibility = vi.fn();
	WindowManager.removeTab(win, 'tab-2', false);

	expect(win.views).toEqual([ kept ]);
	expect(closing.webContents.send).toHaveBeenCalledWith('close-session');
	expect(kept.webContents.send).not.toHaveBeenCalled();
	expect(closing.webContents.close).not.toHaveBeenCalled();

	// The renderer finished its cleanup and closed its session
	const [ , handler ] = ipc.handlers.find(([ channel ]) => channel == 'tab-session-closed');

	handler({}, 'tab-2');
	expect(closing.webContents.close).toHaveBeenCalledTimes(1);
});
