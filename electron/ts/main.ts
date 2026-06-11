'use strict';

declare global {
	var serverAddress: string;
}

// Suppress EPIPE errors when parent pipe closes during shutdown
process.stdout?.on?.('error', () => {});
process.stderr?.on?.('error', () => {});

import { app, BrowserWindow, session, nativeTheme, ipcMain, powerMonitor, dialog, contentTracing } from 'electron';
import { is, fixPathForAsarUnpack } from 'electron-util';
import path from 'path';
import storage from 'electron-json-storage';
import * as remote from '@electron/remote/main';
import { installNativeMessagingHost } from './lib/installNativeMessagingHost';
import { getSafeStorage } from './safeStorage';
import { installExtension } from '@tomjs/electron-devtools-installer';
import Api from './api';
import ConfigManager from './config';
import UpdateManager from './update';
import MenuManager from './menu';
import WindowManager from './window';
import Server from './server';
import Util from './util';
import Cors from '../json/cors.json';
import { AppWindow } from './types';

const protocol = 'anytype';
const binPath = fixPathForAsarUnpack(path.join(__dirname, 'dist', `anytypeHelper${is.windows ? '.exe' : ''}`));
const store = getSafeStorage();

// gRPC DevTools extension ID
const GRPC_DEVTOOLS_ID = 'fohdnlaeecihjiendkfhifhlgldpeopm';

// Fix notifications app name
if (is.windows) {
	app.setAppUserModelId(app.name);
};

storage.setDataPath(app.getPath('userData'));

const csp: string[] = [];

let deeplinkingUrl: string = '';
let waitLibraryPromise: Promise<any> | null = null;
let mainWindow: AppWindow | null = null;
let lastPowerEvent: string = 'suspend';
let isReady: boolean = false;

for (const i in Cors) {
	csp.push([ i ].concat((Cors as any)[i]).join(' '));
};

app.commandLine.appendSwitch('ignore-connections-limit', 'localhost, 127.0.0.1');
app.commandLine.appendSwitch('gtk-version', '3');
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');

// Wayland: ozone-platform is now configured via .desktop files instead of runtime detection
// Users can choose anytype.desktop (native Wayland) or anytype-xwayland.desktop (XWayland)

// GPU/Hardware acceleration settings
// Check for --disable-gpu CLI argument or stored setting
const disableGpu = process.argv.includes('--disable-gpu') || (store.get('hardwareAcceleration') === false);

if (disableGpu) {
	app.disableHardwareAcceleration();
	app.commandLine.appendSwitch('disable-gpu');
	app.commandLine.appendSwitch('disable-gpu-compositing');

	console.log('[GPU] Hardware acceleration disabled');
};

// On Linux, protocol registration is handled by registerLinuxProtocolHandler()
// which checks for an existing .desktop file before writing. Electron's built-in
// setAsDefaultProtocolClient would overwrite .desktop files on every launch.
if (!is.linux) {
	app.removeAsDefaultProtocolClient(protocol);

	if (!process.defaultApp) {
		app.setAsDefaultProtocolClient(protocol);
	};
};

if (!is.macos && (process.argv.length >= 2)) {
	if (process.defaultApp && !is.linux) {
		app.setAsDefaultProtocolClient(protocol, process.execPath, [ path.resolve(process.argv[1]) ]);
	};
	deeplinkingUrl = process.argv.find(arg => arg.startsWith(`${protocol}://`));
};

powerMonitor.on('suspend', () => {
	if (lastPowerEvent == 'suspend') {
		return;
	};

	const firstWindow = WindowManager.getFirstWindow();
	if (firstWindow) {
		Util.send(firstWindow, 'power-event', 'suspend');
		lastPowerEvent = 'suspend';
	};
});

powerMonitor.on('resume', () => {
	if (lastPowerEvent == 'resume') {
		return;
	};

	lastPowerEvent = 'resume';
	Util.log('info', '[PowerMonitor] resume');

	// Notify middleware immediately so it can transition to foreground state
	const firstWindow = WindowManager.getFirstWindow();
	if (firstWindow) {
		Util.send(firstWindow, 'power-event', 'resume');
	};

	// Delay reload to give GPU process time to recover from suspend.
	// Directly reload all tabs — route is preserved in view.data from initial load.
	setTimeout(() => {
		for (const win of WindowManager.list) {
			if (!win || win.isDestroyed() || !win.views) {
				continue;
			};

			for (const view of win.views) {
				if (view && view.webContents && !view.webContents.isDestroyed()) {
					view.webContents.reload();
				};
			};
		};
	}, 1500);
});

ipcMain.on('storeGet', (e: Electron.IpcMainEvent, key: string) => { e.returnValue = store.get(key); });
ipcMain.on('storeSet', (e: Electron.IpcMainEvent, key: string, value: any) => { e.returnValue = store.set(key, value); });
ipcMain.on('storeDelete', (e: Electron.IpcMainEvent, key: string) => { e.returnValue = store.delete(key); });
ipcMain.on('getTheme', (e: Electron.IpcMainEvent) => { e.returnValue = Util.getTheme(); });
ipcMain.on('getBgColor', (e: Electron.IpcMainEvent) => { e.returnValue = Util.getBgColor(Util.getTheme()); });
ipcMain.on('getConfig', (e: Electron.IpcMainEvent) => { e.returnValue = ConfigManager.config || {}; });

if (!is.development && !app.requestSingleInstanceLock()) {
	Api.exit(mainWindow, '', false, false);
	process.exit(0);
};

remote.initialize();
Util.setAppPath(path.join(__dirname));

/**
 * Captures a full cold-start Chromium trace (main + renderer + GPU + network + CPU samples),
 * including the renderer's own User Timing marks (U.Perf — blink.user_timing category).
 *
 * Enable by launching with ANYTYPE_TRACE_STARTUP=1. Optional ANYTYPE_TRACE_DURATION (ms,
 * default 20000) bounds the capture window — bump it if the middleware/server is slow to start.
 * The resulting .json opens in https://ui.perfetto.dev (preferred) or chrome://tracing.
 */
async function maybeStartStartupTrace () {
	const flag = String(process.env.ANYTYPE_TRACE_STARTUP || '').toLowerCase();
	if (![ '1', 'true', 'yes', 'on' ].includes(flag)) {
		return;
	};

	// Full contentTracing instruments the network service. In dev, Vite serves the app
	// unbundled (thousands of separate module requests) and we lift the localhost connection
	// limit, so the throttled net service can't establish all those parallel connections —
	// the renderer fails to load with ERR_CONNECTION_TIMED_OUT. Dev startup is dominated by
	// Vite transforms anyway and isn't representative of real resource loading, so skip it
	// here: use DevTools Performance (reload-record) in dev, and capture a real cold start
	// from a packaged build.
	if (is.development) {
		console.warn('[Trace] Startup tracing skipped in dev — it breaks Vite module loading (ERR_CONNECTION_TIMED_OUT). Use DevTools Performance reload-record in dev, or run a packaged build with ANYTYPE_TRACE_STARTUP=1.');
		return;
	};

	const duration = Number(process.env.ANYTYPE_TRACE_DURATION) || 20000;

	try {
		// Kept lean on purpose: 'toplevel' and 'disabled-by-default-devtools.timeline'
		// produce ~85% of trace volume (per-task scheduler/microtask noise) and most of the
		// tracing overhead, while everything needed for startup analysis — resource waterfall
		// ('loading'), JS flame chart (cpu_profiler samples + script eval/compile events via
		// 'devtools.timeline'), and our U.Perf marks ('blink.user_timing') — lives in the
		// cheap categories below.
		await contentTracing.startRecording({
			included_categories: [
				'devtools.timeline',
				'disabled-by-default-devtools.timeline.frame',
				'disabled-by-default-v8.cpu_profiler',
				'v8.execute',
				'blink.user_timing',
				'loading',
				'navigation',
			],
		});

		console.log(`[Trace] Recording startup for ${duration}ms…`);

		setTimeout(async () => {
			try {
				const out = path.join(app.getPath('userData'), `startup-trace-${Date.now()}.json`);
				await contentTracing.stopRecording(out);

				console.log(`[Trace] Saved: ${out}`);
				console.log('[Trace] Open at https://ui.perfetto.dev or chrome://tracing');
			} catch (e) {
				console.error('[Trace] Failed to stop recording:', (e as Error).message);
			};
		}, duration);
	} catch (e) {
		console.error('[Trace] Failed to start recording:', (e as Error).message);
	};
};

function waitForLibraryAndCreateWindows () {
	const { userDataPath } = ConfigManager.config;

	Util.setNativeThemeSource();

	let currentPath = app.getPath('userData');
	if (userDataPath && (userDataPath != currentPath)) {
		currentPath = userDataPath;
		app.setPath('userData', userDataPath);
	};

	if (process.env.ANYTYPE_USE_SIDE_SERVER) {
		// use the grpc server started from the outside
		Server.setAddress(process.env.ANYTYPE_USE_SIDE_SERVER);
		waitLibraryPromise = Promise.resolve();
	} else {
		waitLibraryPromise = Server.start(binPath, currentPath);
	};

	Util.mkDir(Util.logPath());

	// Create windows immediately so renderer boot (process spawn, bundle
	// parse/eval, React mount) overlaps middleware startup instead of waiting
	// for it. The renderer obtains the gRPC address via Api.getServerAddress,
	// which resolves once the server is up (Server.whenReady)
	createWindow();
	isReady = true;

	waitLibraryPromise.then(() => {
		global.serverAddress = Server.getAddress();
	}, (err: Error) => {
		dialog.showErrorBox('Error: failed to run server', err.toString());
	});
};

// MacOs 12.2 (M1): doesn't fire on manual theme switch
nativeTheme.on('updated', () => {
	const isDark = Util.isDarkTheme();

	MenuManager.updateTrayIcon();
	Api.setBackground(null, Util.getTheme());

	WindowManager.sendToAll('native-theme', isDark);
	WindowManager.sendToAllTabs('native-theme', isDark);
});

function createWindow () {
	const savedWindows = WindowManager.loadAllWindows();
	const primaryRestored = savedWindows.length ? savedWindows[0] : undefined;

	mainWindow = WindowManager.createMain({
		route: Util.getRouteFromUrl(deeplinkingUrl),
		isChild: false,
		restoredTabs: primaryRestored,
	});

	// Restore remaining windows (if any) from saved state
	if (savedWindows.length > 1) {
		for (let i = 1; i < savedWindows.length; i++) {
			const state = savedWindows[i];
			try {
				WindowManager.createMain({
					isChild: true,
					initialBounds: state.bounds,
					restoredTabs: state,
				});
			} catch (e) {
				Util.log('error', `[main] Failed to restore window ${i}: ${(e as Error).message}`);
			};
		};
	};

	WindowManager.clearSavedTabs();

	mainWindow.on('close', (e: Electron.Event) => {
		Util.log('info', 'closeMain: ' + (app as any).isQuiting);

		if ((app as any).isQuiting) {
			return;
		};

		e.preventDefault();

		const onClose = () => {
			const { config } = ConfigManager;

			if (config.hideTray && (WindowManager.list.size <= 1)) {
				Api.exit(mainWindow, '', false, false);
			} else {
				mainWindow.hide();
			};
		};

		if (mainWindow.isFullScreen()) {
			mainWindow.setFullScreen(false);
			mainWindow.once('leave-full-screen', () => onClose());
		} else {
			onClose();
		};
		return false;
	});

	UpdateManager.setWindow(mainWindow);
	UpdateManager.init();

	MenuManager.setWindow(mainWindow);
	MenuManager.initMenu();
	MenuManager.initTray();
	MenuManager.initDock();

	installNativeMessagingHost();
	Util.registerLinuxProtocolHandler();

	//ipcMain.removeHandler('Api');
	ipcMain.handle('Api', (e: Electron.IpcMainInvokeEvent, id: number, cmd: string, args: any[]) => {
		const win = BrowserWindow.fromId(id) as AppWindow | null;

		if (!win) {
			console.error('[Api] window is not defined', cmd, id);
			return;
		};

		// For events that should only be processed once per broadcast,
		// skip if the sender is not the active tab
		if (Api.activeTabOnly?.has(cmd)) {
			const activeView = Util.getActiveView(win);

			if (!activeView || (e.sender.id !== activeView.webContents.id)) {
				return;
			};
		};

		if (Api[cmd]) {
			return Api[cmd].apply(Api, [ win ].concat(args || []));
		} else {
			console.error('[Api] method not defined:', cmd);
			return null;
		};
	});
};

app.on('ready', async () => {
	await maybeStartStartupTrace();

	session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
		callback({
			responseHeaders: {
				...details.responseHeaders,
				'Content-Security-Policy': [ csp.join('; ') ]
			}
		});
	});

	// Intercept requests and add referrer/origin for YouTube only
	session.defaultSession.webRequest.onBeforeSendHeaders({
		urls: [
			'*://www.youtube.com/*',
			'*://www.youtube-nocookie.com/*',
		],
	}, (details, callBack) => {
		const headers = details.requestHeaders;

		// Detect missing or file:// origin
		const currentOrigin = headers['Origin'];
		const isFileOrigin =
			!currentOrigin ||
			(currentOrigin === 'null') ||
			currentOrigin.startsWith('file://');

		if (isFileOrigin) {
			details.requestHeaders['Referer'] = 'https://localhost/';
			details.requestHeaders['Origin'] = 'https://localhost';
		};

		callBack({ requestHeaders: details.requestHeaders });
	});

	// Load gRPC DevTools extension in development mode
	if (is.development) {
		try {
			// Install the extension using electron-devtools-installer
			await installExtension(GRPC_DEVTOOLS_ID, {
				loadExtensionOptions: {
					allowFileAccess: true
				}
			});

			console.log(`gRPC DevTools extension installed`);
		} catch (e) {
			console.error('Failed to install gRPC DevTools extension:', e.message);
		};
	};

	ConfigManager.init(waitForLibraryAndCreateWindows);
});

app.on('second-instance', (event, argv) => {
	Util.log('info', 'second-instance');

	if (!mainWindow) {
		return;
	};

	if (!is.macos) {
		deeplinkingUrl = argv.find(arg => arg.startsWith(`${protocol}://`));
	};

	if (deeplinkingUrl) {
		Util.send(mainWindow, 'route', Util.getRouteFromUrl(deeplinkingUrl));
	};

	if (mainWindow.isMinimized()) {
		mainWindow.restore();
	};
	if (!mainWindow.isVisible()) {
		mainWindow.show();
	};

	mainWindow.focus();

	// Ensure focus is properly stolen on macOS
	if (is.macos) {
		app.focus({ steal: true });
	};
});

app.on('before-quit', (e) => {
	Util.log('info', 'before-quit, isRelaunching: ' + UpdateManager.isRelaunching);

	if (UpdateManager.isRelaunching) {
		// Let electron-updater handle the quit and relaunch — do not force exit
		return;
	};

	if ((app as any).isQuiting) {
		app.exit(0);
	} else {
		e.preventDefault();
		Api.exit(mainWindow, '', false, false);
	};
});

// Handle SIGINT (Ctrl+C) and SIGTERM gracefully instead of abrupt exit
const handleSignal = (signal: string) => {
	Util.log('info', `Received ${signal}`);

	if ((app as any).isQuiting) {
		app.exit(0);
	} else {
		Api.exit(mainWindow, signal, false, false);
	};
};

process.on('SIGINT', () => handleSignal('SIGINT'));
process.on('SIGTERM', () => handleSignal('SIGTERM'));

app.on('activate', () => {
	if (WindowManager.list.size && mainWindow) {
		mainWindow.show();
		mainWindow.focus();

		if (is.macos) {
			app.focus({ steal: true });
		};
	} else
	if (isReady) {
		createWindow();
	};
});

app.on('open-url', (e, url) => {
	e.preventDefault();

	deeplinkingUrl = url;

	if (!mainWindow) {
		return;
	};

	Util.send(mainWindow, 'route', Util.getRouteFromUrl(url));

	if (mainWindow.isMinimized()) {
		mainWindow.restore();
	};

	if (!mainWindow.isVisible()) {
		mainWindow.show();
	};

	mainWindow.focus();

	if (is.macos) {
		app.focus({ steal: true });
	};
});
