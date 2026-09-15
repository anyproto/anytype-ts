import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	start: vi.fn(),
	cancel: vi.fn(),
	download: vi.fn(async () => {}),
}));

vi.mock('./download', () => ({
	default: {
		start: mocks.start,
		cancel: mocks.cancel,
	},
}));

vi.mock('electron-dl', () => ({ download: mocks.download }));

// Everything api.ts drags in that has nothing to do with downloads
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
vi.mock('keytar', () => ({ default: {} }));
vi.mock('check-disk-space', () => ({ default: async () => ({ free: 0, size: 0 }) }));
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
});

describe('Api.download', () => {
	test('hands the queue everything the renderer sent about the file', async () => {
		await Api.download(win, 'http://gateway/file/object?attachment=1', {
			id: 'download-1',
			directory: '/downloads',
			objectId: 'object',
			name: 'report.pdf',
			size: 1200,
			checksums: [ 'CHECKSUM1', 'CHECKSUM2' ],
		});

		// Dropping any of these silently disables recognising a copy already on
		// disk: the queue cannot ask for what it was never told
		expect(mocks.start).toHaveBeenCalledWith(win, {
			id: 'download-1',
			url: 'http://gateway/file/object?attachment=1',
			directory: '/downloads',
			objectId: 'object',
			name: 'report.pdf',
			size: 1200,
			checksums: [ 'CHECKSUM1', 'CHECKSUM2' ],
		});
		expect(mocks.download).not.toHaveBeenCalled();
	});

	test('sends an untracked download straight to the stack', async () => {
		await Api.download(win, 'data:image/png;base64,AAAA', { saveAs: true });

		// The save-as dialogs for QR codes and cover images carry no id, want no
		// progress row and must keep working exactly as before
		expect(mocks.start).not.toHaveBeenCalled();
		expect(mocks.download).toHaveBeenCalledWith(win, 'data:image/png;base64,AAAA', { saveAs: true });
	});

	test('cancels by the id the renderer knows', () => {
		Api.downloadCancel(win, 'download-1');

		expect(mocks.cancel).toHaveBeenCalledWith('download-1');
	});
});
