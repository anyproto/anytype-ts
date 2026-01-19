/**
 * Web-compatible mock of the Electron API for browser mode.
 * This enables running Anytype in a standard web browser without Electron.
 */

/**
 * Upload a file to the dev server and get a real filesystem path.
 * The dev server writes the file to a temp directory that the backend can access.
 */
async function uploadFileToServer(file: File): Promise<string> {
	// Read file as base64
	const base64 = await new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result as string;
			// Remove data URL prefix to get just the base64
			const base64 = result.split(',')[1] || result;
			resolve(base64);
		};
		reader.onerror = () => reject(new Error('Failed to read file'));
		reader.readAsDataURL(file);
	});

	// Upload to dev server
	const response = await fetch('/api/web-upload', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			filename: file.name,
			content: base64,
		}),
	});

	if (!response.ok) {
		throw new Error(`Upload failed: ${response.statusText}`);
	}

	const result = await response.json();
	console.log('[WebFile] Uploaded:', file.name, '->', result.path);
	return result.path;
}

interface MockTab {
	id: string;
	data: any;
	token?: string;
}

interface MockConfig {
	theme: string;
	zoom: number;
	interfaceLang: string;
	languages: string[];
	hideTray: boolean;
	showMenuBar: boolean;
	flagsMw: {
		time: boolean;
		json: boolean;
		request: boolean;
		event: boolean;
		sync: boolean;
		file: boolean;
		subscribe: boolean;
	};
}

class WebStorage {
	private prefix = 'anytype_';

	get(key: string): any {
		try {
			const value = localStorage.getItem(this.prefix + key);
			return value ? JSON.parse(value) : undefined;
		} catch {
			return undefined;
		}
	}

	set(key: string, value: any): void {
		try {
			localStorage.setItem(this.prefix + key, JSON.stringify(value));
		} catch (e) {
			console.warn('[WebStorage] Failed to set:', key, e);
		}
	}

	delete(key: string): void {
		localStorage.removeItem(this.prefix + key);
	}
}

type ApiHandler = (args: any[]) => any | Promise<any>;

type EventCallback = (...args: any[]) => void;

class ElectronMock {
	private storage = new WebStorage();
	private eventListeners: Map<string, Set<EventCallback>> = new Map();
	private tabId_ = 'web-' + Math.random().toString(36).substring(7);
	private tabs: MockTab[] = [{ id: this.tabId_, data: {} }];
	private config: MockConfig;
	private windowId = 1;
	private apiHandlers: Map<string, ApiHandler>;

	constructor() {
		this.config = this.storage.get('config') || this.getDefaultConfig();
		this.apiHandlers = this.initApiHandlers();
	}

	private getDefaultConfig(): MockConfig {
		return {
			theme: '',
			zoom: 0,
			interfaceLang: 'en-US',
			languages: [],
			hideTray: false,
			showMenuBar: true,
			flagsMw: {
				time: false,
				json: false,
				request: false,
				event: false,
				sync: false,
				file: false,
				subscribe: false,
			},
		};
	}

	private initApiHandlers(): Map<string, ApiHandler> {
		const handlers = new Map<string, ApiHandler>();

		// Init & config handlers
		handlers.set('getInitData', () => ({
			id: this.windowId,
			dataPath: this.userPath(),
			config: this.config,
			isDark: this.config.theme === 'dark' ||
				(this.config.theme === '' && window.matchMedia('(prefers-color-scheme: dark)').matches),
			isChild: false,
			route: '',
			isPinChecked: true,
			languages: navigator.languages,
			css: '',
			activeIndex: 0,
			isSingleTab: true,
		}));

		handlers.set('setConfig', (args) => {
			Object.assign(this.config, args[0]);
			this.storage.set('config', this.config);
			return true;
		});

		handlers.set('setTheme', (args) => {
			this.config.theme = args[0];
			this.storage.set('config', this.config);
			document.body.classList.remove('themeDark', 'themeLight');
			if (args[0] === 'dark') {
				document.body.classList.add('themeDark');
			} else if (args[0] === 'light') {
				document.body.classList.add('themeLight');
			}
			return true;
		});

		handlers.set('setZoom', (args) => {
			this.config.zoom = args[0];
			this.storage.set('config', this.config);
			return true;
		});

		// URL & path handlers
		handlers.set('openUrl', (args) => {
			window.open(args[0], '_blank');
			return true;
		});

		handlers.set('openPath', (args) => {
			console.log('[Web] openPath not supported:', args[0]);
			return true;
		});

		// Keytar handlers (credential storage)
		handlers.set('keytarGet', (args) => this.storage.get('keytar_' + args[0]) || null);
		handlers.set('keytarSet', (args) => {
			this.storage.set('keytar_' + args[0], args[1]);
			return true;
		});
		handlers.set('keytarDelete', (args) => {
			this.storage.delete('keytar_' + args[0]);
			return true;
		});

		// Tab handlers
		handlers.set('getTabs', () => ({
			tabs: this.tabs.map(t => ({ id: t.id, data: t.data })),
			id: this.tabId_,
			isVisible: false,
		}));

		handlers.set('getTab', (args) => {
			const tab = this.tabs.find(t => t.id === args[0]);
			return tab ? { id: tab.id, data: tab.data, token: tab.token } : null;
		});

		handlers.set('updateTab', (args) => {
			const tabToUpdate = this.tabs.find(t => t.id === args[0]);
			if (tabToUpdate) {
				tabToUpdate.data = { ...tabToUpdate.data, ...args[1] };
				if (args[1].token) {
					tabToUpdate.token = args[1].token;
				}
			}
			return true;
		});

		// Download & file handlers
		handlers.set('download', (args) => {
			const link = document.createElement('a');
			link.href = args[0];
			link.download = args[1]?.filename || 'download';
			link.click();
			return true;
		});

		handlers.set('checkDiskSpace', () => ({
			free: 100 * 1024 * 1024 * 1024,
			size: 500 * 1024 * 1024 * 1024,
		}));

		// Notification handler
		handlers.set('notification', (args) => {
			if ('Notification' in window && Notification.permission === 'granted') {
				new Notification(args[0]?.title || '', { body: args[0]?.text || '' });
			}
			return true;
		});

		// Window handlers
		handlers.set('reload', () => {
			window.location.reload();
			return true;
		});

		handlers.set('focusWindow', () => {
			window.focus();
			return true;
		});

		handlers.set('setBadge', (args) => {
			document.title = args[0] ? `(${args[0]}) Anytype` : 'Anytype';
			return true;
		});

		// Session handlers
		handlers.set('logout', () => this.clearStorageAndReload());
		handlers.set('exit', () => this.clearStorageAndReload());
		handlers.set('shutdown', () => this.clearStorageAndReload());

		// Clipboard handler
		handlers.set('paste', async () => {
			if (navigator.clipboard) {
				const text = await navigator.clipboard.readText();
				document.execCommand('insertText', false, text);
			}
			return true;
		});

		// Config persistence handlers
		const configHandler = (args: any[]) => {
			this.config = { ...this.config, ...args[0] };
			this.storage.set('config', this.config);
			return true;
		};
		handlers.set('setUserDataPath', configHandler);
		handlers.set('setChannel', configHandler);
		handlers.set('setInterfaceLang', configHandler);

		// No-op handlers that return true
		const noopTrue = () => true;
		['minimize', 'maximize', 'close', 'toggleFullScreen'].forEach(cmd => {
			handlers.set(cmd, () => {
				console.log('[Web] Window command not supported:', cmd);
				return true;
			});
		});

		['setPinChecked', 'pinCheck', 'pinSet', 'pinRemove'].forEach(cmd => handlers.set(cmd, noopTrue));
		['setSpellingLang', 'spellcheckAdd'].forEach(cmd => handlers.set(cmd, noopTrue));
		['updateCheck', 'updateDownload', 'updateConfirm', 'updateCancel'].forEach(cmd => {
			handlers.set(cmd, () => {
				console.log('[Web] Updates not supported in web mode');
				return true;
			});
		});

		['menu', 'initMenu', 'setHideTray', 'setMenuBarVisibility', 'setHardwareAcceleration'].forEach(cmd => {
			handlers.set(cmd, () => {
				console.log('[Web] Menu/system command not supported:', cmd);
				return true;
			});
		});

		['openTab', 'openWindow', 'setActiveTab', 'removeTab', 'closeOtherTabs',
			'reorderTabs', 'setTabsDimmer', 'winCommand', 'setAlwaysShowTabs'].forEach(cmd => {
			handlers.set(cmd, () => {
				console.log('[Web] Tab command not supported:', cmd);
				return true;
			});
		});

		['showChallenge', 'hideChallenge'].forEach(cmd => {
			handlers.set(cmd, () => {
				console.log('[Web] Challenge not supported:', cmd);
				return true;
			});
		});

		handlers.set('payloadBroadcast', noopTrue);

		// No-op handlers that return empty object
		['systemInfo', 'linuxDistro', 'shortcutExport', 'shortcutImport'].forEach(cmd => {
			handlers.set(cmd, () => ({}));
		});

		handlers.set('moveNetworkConfig', () => ({ error: 'Not supported in web mode' }));

		return handlers;
	}

	private clearStorageAndReload(): true {
		Object.keys(localStorage).forEach(key => {
			if (key.startsWith('anytype_')) {
				localStorage.removeItem(key);
			}
		});
		window.location.reload();
		return true;
	}

	version = {
		app: '0.0.0-web',
		os: `${navigator.platform} (Web)`,
		system: navigator.userAgent,
		device: 'Web Browser',
	};

	platform = 'web';
	arch = 'web';
	isPackaged = false;

	storeGet = (key: string) => this.storage.get(key);
	storeSet = (key: string, value: any) => this.storage.set(key, value);
	storeDelete = (key: string) => this.storage.delete(key);

	// Get data path from URL params, localStorage, or window config
	// This path must be writable by the anytypeHelper backend
	private getDataPath = (): string => {
		// Check URL params first
		const urlParams = new URLSearchParams(window.location.search);
		const urlDataPath = urlParams.get('dataPath');
		if (urlDataPath) {
			return urlDataPath;
		}

		// Check localStorage
		const storedPath = localStorage.getItem('anytype_dataPath');
		if (storedPath) {
			return storedPath;
		}

		// Check window config
		if ((window as any).AnytypeGlobalConfig?.dataPath) {
			return (window as any).AnytypeGlobalConfig.dataPath;
		}

		// Default: use a path in user's home directory
		// This will be resolved by the backend based on OS
		return '';
	};

	userPath = () => this.getDataPath();
	tmpPath = () => '/tmp';
	downloadPath = () => this.getDataPath() ? `${this.getDataPath()}/downloads` : '/tmp/anytype-web/downloads';
	logPath = () => this.getDataPath() ? `${this.getDataPath()}/logs` : '/tmp/anytype-web/logs';
	defaultPath = () => this.getDataPath();

	dirName = (fp: string) => fp.substring(0, fp.lastIndexOf('/'));
	filePath = (...args: string[]) => args.join('/');
	fileName = (fp: string) => fp.substring(fp.lastIndexOf('/') + 1);
	fileMime = (_fp: string) => 'application/octet-stream';
	fileExt = (fp: string) => {
		const idx = fp.lastIndexOf('.');
		return idx >= 0 ? fp.substring(idx + 1) : '';
	};
	fileSize = (_fp: string) => 0;
	isDirectory = (_fp: string) => false;

	getTheme = () => this.config.theme || '';
	getBgColor = () => this.config.theme === 'dark' ? '#171717' : '#fff';

	tabId = () => this.tabId_;

	currentWindow = () => ({
		windowId: this.windowId,
		isFocused: () => document.hasFocus(),
		isFullScreen: () => !!document.fullscreenElement,
	});

	isFocused = () => document.hasFocus();
	isFullScreen = () => !!document.fullscreenElement;

	focus = () => window.focus();

	getGlobal = (key: string) => {
		if (key === 'serverAddress') {
			// Get gRPC-web proxy address from window config or env
			// Note: anytypeHelper starts gRPC on port X and gRPC-web proxy on port X+1
			return (window as any).AnytypeGlobalConfig?.serverAddress ||
				(window as any).GRPC_SERVER_ADDRESS ||
				'http://127.0.0.1:31008';
		}
		return null;
	};

	showOpenDialog = async (options: any) => {
		// Use the File System Access API if available
		if ('showOpenFilePicker' in window) {
			try {
				const handles = await (window as any).showOpenFilePicker({
					multiple: options?.properties?.includes('multiSelections'),
					types: options?.filters?.map((f: any) => ({
						description: f.name,
						accept: { '*/*': f.extensions?.map((e: string) => '.' + e) || ['*'] },
					})),
				});
				const files: File[] = await Promise.all(handles.map((h: any) => h.getFile()));

				// Upload files to server to get real filesystem paths
				const filePaths = await Promise.all(files.map(f => uploadFileToServer(f)));

				return {
					canceled: false,
					filePaths,
					files
				};
			} catch (e) {
				console.log('[showOpenDialog] Canceled or error:', e);
				return { canceled: true, filePaths: [] };
			}
		}

		// Fallback to input element
		return new Promise((resolve) => {
			const input = document.createElement('input');
			input.type = 'file';
			input.multiple = options?.properties?.includes('multiSelections');
			input.onchange = async () => {
				const files = Array.from(input.files || []);
				if (files.length === 0) {
					resolve({ canceled: true, filePaths: [], files: [] });
					return;
				}

				try {
					// Upload files to server to get real filesystem paths
					const filePaths = await Promise.all(files.map(f => uploadFileToServer(f)));
					resolve({
						canceled: false,
						filePaths,
						files
					});
				} catch (e) {
					console.error('[showOpenDialog] Upload error:', e);
					resolve({ canceled: true, filePaths: [], files: [] });
				}
			};
			input.click();
		});
	};

	webFilePath = (file: File) => file.name;

	fileWrite = (name: string, data: any, _options?: any) => {
		// Create a blob and download it
		const blob = new Blob([data]);
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = name;
		a.click();
		URL.revokeObjectURL(url);
		return name;
	};

	on = (event: string, callback: EventCallback) => {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, new Set());
		}
		this.eventListeners.get(event)!.add(callback);
	};

	removeAllListeners = (event: string) => {
		this.eventListeners.delete(event);
	};

	emit = (event: string, ...args: any[]) => {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			listeners.forEach(cb => cb(null, ...args));
		}
	};

	Api = async (_id: number, cmd: string, args: any[] = []): Promise<any> => {
		const handler = this.apiHandlers.get(cmd);
		if (handler) {
			return handler(args);
		}
		console.log('[Web] Unknown API command:', cmd, args);
		return null;
	};
}

export const electronMock = new ElectronMock();
export default electronMock;
