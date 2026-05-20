/**
 * Mock Electron API for Storybook environment.
 * Components access this via U.Common.getElectron() which returns window.Electron || {}.
 */

const noop = () => {};
const noopReturn = (v: any) => () => v;

const ElectronMock = {
	// Platform info
	platform: 'mac',
	arch: 'arm64',
	version: {
		app: '0.0.0-storybook',
		electron: '0.0.0',
		os: 'storybook',
	},
	isPackaged: false,

	// Window management
	currentWindow: () => ({ windowId: 1 }),
	winId: () => 1,
	focus: noop,
	isMaximized: noopReturn(false),

	// Tab management
	tabId: () => 'storybook-tab',

	// Store (electron-store)
	storeGet: (_key: string) => undefined,
	storeSet: noop,
	storeDelete: noop,

	// File system
	dirName: (_path: string) => '/',
	logPath: noopReturn('/tmp/storybook.log'),
	fileWrite: (_name: string, _data: any) => '/tmp/storybook-file',
	tmpPath: noopReturn('/tmp'),
	userPath: noopReturn('/tmp/user'),

	// IPC
	Api: (_winId: number, _cmd: string, _args: any[]) => Promise.resolve(),
	on: noop,
	removeAllListeners: noop,
	send: noop,

	// Clipboard
	clipboardStore: {
		getFiles: noopReturn([]),
	},

	// Misc
	isChild: noopReturn(false),
};

// Install globally
(window as any).Electron = ElectronMock;
(window as any).AnytypeGlobalConfig = {};
(window as any).isExtension = false;

export default ElectronMock;
