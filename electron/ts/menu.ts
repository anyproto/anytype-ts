import { app, shell, Menu, Tray, BrowserWindow, dialog, nativeImage } from 'electron';
import { is, fixPathForAsarUnpack } from 'electron-util';
import fs from 'fs';
import path from 'path';
import Api from './api';
import ConfigManager from './config';
import UpdateManager from './update';
import WindowManager from './window';
import Util from './util';
import { getSafeStorage } from './safeStorage';
import { AppWindow, TabView } from './types';

const Separator: Electron.MenuItemConstructorOptions = { type: 'separator' };

const DEFAULT_SHORTCUTS: { [key: string]: string[] } = {
	createObject: [ 'CmdOrCtrl', 'N' ],
	undo: [ 'CmdOrCtrl', 'Z' ],
	redo: [ 'CmdOrCtrl', 'Shift', 'Z' ],
	selectAll: [ 'CmdOrCtrl', 'A' ],
	searchText: [ 'CmdOrCtrl', 'F' ],
	print: [ 'CmdOrCtrl', 'P' ],
	newWindow: [ 'CmdOrCtrl', 'Shift', 'N' ],
	zoomIn: [ 'CmdOrCtrl', '=' ],
	zoomOut: [ 'CmdOrCtrl', '-' ],
	zoomReset: [ 'CmdOrCtrl', '0' ],
	toggleFullScreen: [ 'CmdOrCtrl', 'Shift', 'F' ],
	shortcut: [ 'Ctrl', 'Space' ],
	close: [ 'CmdOrCtrl', 'Q' ],
	createSpace: [],
	newTab: [ 'CmdOrCtrl', 'T' ],
	closeTab: [ 'CmdOrCtrl', 'W' ],
	nextTab: [ 'CmdOrCtrl', 'Alt', 'Right' ],
	prevTab: [ 'CmdOrCtrl', 'Alt', 'Left' ],
};

class MenuManager {

	win: AppWindow | null = null;
	menu: Electron.Menu | null = null;
	tray: Tray | null = null;
	shortcuts: { [key: string]: string[] } = {};

	setWindow (win: AppWindow): void {
		this.win = win;
	};

	initShortcuts (): void {
		this.shortcuts = getSafeStorage().get('shortcuts') || {};
	};

	getAccelerator (id: string): string {
		let keys = this.shortcuts[id];

		if (undefined === keys) {
			return (DEFAULT_SHORTCUTS[id] || []).join('+');
		};

		keys = keys || [];

		const arrowKeys: { [key: string]: string } = { arrowup: 'Up', arrowdown: 'Down', arrowleft: 'Left', arrowright: 'Right', up: 'Up', down: 'Down', left: 'Left', right: 'Right' };
		const ret: string[] = [];
		for (const key of keys) {
			const keyLower = key.toLowerCase();
			if ((keyLower == 'ctrl') || (keyLower == 'cmd')) {
				ret.push('CmdOrCtrl');
			} else
			if (keyLower == 'shift') {
				ret.push('Shift');
			} else
			if (keyLower == 'alt') {
				ret.push('Alt');
			} else
			if (key == '+') {
				ret.push('Plus');
			} else
			if (arrowKeys[keyLower]) {
				ret.push(arrowKeys[keyLower]);
			} else {
				ret.push(key.toUpperCase());
			};
		};
		return ret.join('+');
	};

	getView (): TabView | undefined {
		return Util.getActiveView(this.win);
	};

	initMenu (): void {
		this.initShortcuts();

		const { config } = ConfigManager;



		const isAllowedUpdate = UpdateManager.isAllowed();

		config.debug = config.debug || {};
		config.flagsMw = config.flagsMw || {};

		const menuParam: Electron.MenuItemConstructorOptions[] = [
			{
				label: 'Anytype',
				submenu: [
					{ label: Util.translate('electronMenuAbout'), click: () => Util.send(this.win, 'popup', 'about', {}, true) },

					Separator,

					{ role: 'hide', label: Util.translate('electronMenuHide') },
					{ role: 'hideOthers', label: Util.translate('electronMenuHideOthers') },
					{ role: 'unhide', label: Util.translate('electronMenuUnhide') },

					{ type: 'separator', visible: isAllowedUpdate },
					{ label: Util.translate('electronMenuCheckUpdates'), click: () => Api.updateCheck(this.win), visible: isAllowedUpdate },

					Separator,

					{ label: Util.translate('commonSettings'), submenu: this.menuSettings() },

					Separator,

					{ label: Util.translate('electronMenuQuit'), accelerator: this.getAccelerator('close'), click: () => Api.exit(this.win, '', false, false) },
				]
			},
			{
				role: 'fileMenu', label: Util.translate('electronMenuFile'),
				submenu: [
					{ label: Util.translate('commonNewObject'), accelerator: this.getAccelerator('createObject'), click: () => Util.send(this.win, 'commandGlobal', 'createObject') },
					{ label: Util.translate('commonNewSpace'), accelerator: this.getAccelerator('createSpace'), click: () => Util.send(this.win, 'commandGlobal', 'createSpace') },

					Separator,

					{ label: Util.translate('electronMenuImport'), click: () => this.openSettings('importIndex') },
					{ label: Util.translate('electronMenuExport'), click: () => this.openSettings('exportIndex') },
					{ label: Util.translate('electronMenuSaveAs'), click: () => Util.send(this.win, 'commandGlobal', 'save') },

					Separator,

					{
						label: Util.translate('electronMenuOpen'), submenu: [
							{ label: Util.translate('electronMenuWorkDirectory'), click: () => shell.openPath(Util.userPath()) },
							{ label: Util.translate('electronMenuDataDirectory'), click: () => shell.openPath(Util.dataPath()) },
							{ label: Util.translate('electronMenuConfigDirectory'), click: () => shell.openPath(Util.defaultUserDataPath()) },
							{ label: Util.translate('electronMenuLogsDirectory'), click: () => shell.openPath(Util.logPath()) },
							{
								label: Util.translate('electronMenuCustomCss'),
								click: () => {
									const fp = path.join(Util.userPath(), 'custom.css');

									if (!fs.existsSync(fp)) {
										fs.writeFileSync(fp, '');
									};

									shell.openPath(fp);
								},
							},
						]
					},

					Separator,

					{
						label: Util.translate('electronMenuApplyCustomCss'), type: 'checkbox', checked: !config.disableCss,
						click: () => {
							config.disableCss = !config.disableCss;
							Api.setConfig(this.win, { disableCss: config.disableCss }, () => {
								WindowManager.reloadAll();
							});
						},
					},

					Separator,

					{
						label: Util.translate('electronMenuCloseTab'),
						accelerator: this.getAccelerator('closeTab'),
						click: () => {
							WindowManager.closeActiveTab(this.win);
						},
					},
					{
						label: Util.translate('electronMenuClose'),
						click: () => {
							Api.close(this.win);
						},
					},
				]
			},
			{
				label: Util.translate('electronMenuEdit'),
				submenu: [
					{
						label: Util.translate('electronMenuUndo'), accelerator: this.getAccelerator('undo'),
						click: () => {
							if (this.win) {
								this.getView().webContents.undo();
								Util.send(this.win, 'commandGlobal', 'undo');
							};
						}
					},
					{
						label: Util.translate('electronMenuRedo'), accelerator: this.getAccelerator('redo'),
						click: () => {
							if (this.win) {
								this.getView().webContents.redo();
								Util.send(this.win, 'commandGlobal', 'redo');
							};
						}
					},

					Separator,

					{ label: Util.translate('electronMenuCopy'), role: 'copy' },
					{ label: Util.translate('electronMenuCut'), role: 'cut' },
					{ label: Util.translate('electronMenuPaste'), role: 'paste' },
					{
						label: Util.translate('electronMenuPastePlain'), accelerator: 'CmdOrCtrl+Shift+V',
						click: () => {
							if (is.macos) {
								Util.send(this.win, 'commandEditor', 'pastePlain');
							};
						},
					},

					Separator,

					{
						label: Util.translate('electronMenuSelectAll'), accelerator: this.getAccelerator('selectAll'),
						click: () => {
							if (this.win) {
								this.getView().webContents.selectAll();
								Util.send(this.win, 'commandEditor', 'selectAll');
							};
						}
					},
					{ label: Util.translate('electronMenuSearch'), accelerator: this.getAccelerator('searchText'), click: () => Util.send(this.win, 'commandGlobal', 'search') },

					Separator,

					{ label: Util.translate('electronMenuPrint'), accelerator: this.getAccelerator('print'), click: () => Util.send(this.win, 'commandGlobal', 'print') },
				]
			},
			{
				role: 'windowMenu', label: Util.translate('electronMenuWindow'),
				submenu: [
					{ label: Util.translate('electronMenuNewWindow'), accelerator: this.getAccelerator('newWindow'), click: () => WindowManager.createMain({ isChild: true }) },
					{ label: Util.translate('electronMenuNewTab'), accelerator: this.getAccelerator('newTab'), click: () => {
				
						const activeView = Util.getActiveView(this.win);
						const { isPinned, ...data } = activeView?.data || {};

						data.route = '/main/void/dashboard';
						Api.openTab(this.win, data, { fireAnalytics: true });
					}
				},
					{ label: Util.translate('electronMenuPrevTab'), accelerator: this.getAccelerator('prevTab'), click: () => WindowManager.prevTab(this.win) },
					{ label: Util.translate('electronMenuNextTab'), accelerator: this.getAccelerator('nextTab'), click: () => WindowManager.nextTab(this.win) },

					Separator,

					{ role: 'minimize', label: Util.translate('electronMenuMinimise') },
					{ label: Util.translate('electronMenuZoomIn'), accelerator: this.getAccelerator('zoomIn'), click: () => Api.setZoom(this.win, this.getView().webContents.getZoomLevel() + 1) },
					{ label: Util.translate('electronMenuZoomOut'), accelerator: this.getAccelerator('zoomOut'), click: () => Api.setZoom(this.win, this.getView().webContents.getZoomLevel() - 1) },
					{ label: Util.translate('electronMenuZoomDefault'), accelerator: this.getAccelerator('zoomReset'), click: () => Api.setZoom(this.win, 0) },
					{
						label: Util.translate('electronMenuFullScreen'), accelerator: this.getAccelerator('toggleFullScreen'), type: 'checkbox', checked: this.win.isFullScreen(),
						click: () => Api.toggleFullScreen(this.win),
					},
					{
						label: Util.translate('electronMenuReload'), accelerator: 'CmdOrCtrl+R', click: () => {
							this.win.reload();
							this.getView().webContents.reload();
						},
					}
				]
			},
			{
				label: Util.translate('electronMenuHelp'),
				submenu: [
					{
						label: `${Util.translate('electronMenuReleaseNotes')} (${app.getVersion()})`,
						click: () => Util.send(this.win, 'popup', 'help', { data: { document: 'whatsNew' } })
					},
					{
						label: Util.translate('electronMenuShortcuts'), accelerator: this.getAccelerator('shortcut'),
						click: () => Util.send(this.win, 'commandGlobal', 'shortcut')
					},

					Separator,

					{ label: Util.translate('electronMenuGallery'), click: () => Util.send(this.win, 'commandGlobal', 'gallery') },
					{ label: Util.translate('electronMenuCommunity'), click: () => Util.send(this.win, 'commandGlobal', 'community') },
					{ label: Util.translate('electronMenuTutorial'), click: () => Util.send(this.win, 'commandGlobal', 'tutorial') },
					{ label: Util.translate('electronMenuContact'), click: () => Util.send(this.win, 'commandGlobal', 'contact') },
					{ label: Util.translate('electronMenuTech'), click: () => Util.send(this.win, 'commandGlobal', 'tech') },
					{ label: Util.translate('electronMenuSubmitReport'), click: () => Util.send(this.win, 'commandGlobal', 'submitReport') },

					Separator,

					{ label: Util.translate('electronMenuTerms'), click: () => Util.send(this.win, 'commandGlobal', 'terms') },
					{ label: Util.translate('electronMenuPrivacy'), click: () => Util.send(this.win, 'commandGlobal', 'privacy') },

				]
			},
		];

		const flags: { [key: string]: string } = {
			ui: Util.translate('electronMenuFlagInterface'),
			hiddenObject: Util.translate('electronMenuFlagHidden'),
			analytics: Util.translate('electronMenuFlagAnalytics'),
		};

		const flagsMw: { [key: string]: string } = {
			request: Util.translate('electronMenuFlagMwRequest'),
			subscribe: Util.translate('electronMenuFlagMwSubscribe'),
			event: Util.translate('electronMenuFlagMwEvent'),
			sync: Util.translate('electronMenuFlagMwSync'),
			file: Util.translate('electronMenuFlagMwFile'),
			time: Util.translate('electronMenuFlagMwTime'),
			json: Util.translate('electronMenuFlagMwJson'),
		};

		const flagMenu: Electron.MenuItemConstructorOptions[] = [];
		const flagMwMenu: Electron.MenuItemConstructorOptions[] = [];

		for (const i in flags) {
			flagMenu.push({
				label: flags[i], type: 'checkbox', checked: config.debug[i],
				click: () => {
					config.debug[i] = !config.debug[i];
					Api.setConfig(this.win, { debug: config.debug });

					if ([ 'hiddenObject' ].includes(i)) {
						this.win.reload();
						this.getView().webContents.reload();
					};
				}
			});
		};

		for (const i in flagsMw) {
			flagMwMenu.push({
				label: flagsMw[i], type: 'checkbox', checked: config.flagsMw[i],
				click: () => {
					config.flagsMw[i] = !config.flagsMw[i];
					Api.setConfig(this.win, config);
				}
			});
		};

		flagMenu.push(Separator);
		flagMenu.push({
			label: Util.translate('electronMenuFlagMw'),
			submenu: flagMwMenu,
		});

		menuParam.push({
			label: Util.translate('electronMenuDebug'),
			submenu: [
				{ label: Util.translate('electronMenuFlags'), submenu: flagMenu },

				Separator,

				{ label: Util.translate('electronMenuDebugSpace'), click: () => Util.send(this.win, 'commandGlobal', 'debugSpace') },
				{ label: Util.translate('electronMenuDebugObject'), click: (item: Electron.MenuItem, window: BrowserWindow | undefined, event: Electron.KeyboardEvent) => {
					const unanonymized = event && (event as Electron.KeyboardEvent & { altKey?: boolean }).altKey;

					if (unanonymized) {
						const { dialog } = require('electron');
						const result = dialog.showMessageBoxSync(this.win, {
							type: 'warning',
							buttons: [ 'Cancel', 'OK' ],
							defaultId: 0,
							title: 'Debug without anonymization',
							message: 'You are exporting this object and all its history of changes without anonymization.',
							detail: 'This file will contain sensitive data. Only proceed if you understand the privacy implications.'
						});

						if (!result) {
							return; // User clicked Cancel
						};
					};

					Util.send(this.win, 'commandGlobal', 'debugTree', { unanonymized });
				}},
				{ label: Util.translate('electronMenuDebugProcess'), click: () => Util.send(this.win, 'commandGlobal', 'debugProcess') },
				{ label: Util.translate('electronMenuDebugStat'), click: () => Util.send(this.win, 'commandGlobal', 'debugStat') },
				{ label: Util.translate('electronMenuDebugReconcile'), click: () => Util.send(this.win, 'commandGlobal', 'debugReconcile') },
				{ label: Util.translate('electronMenuDebugNet'), click: () => Util.send(this.win, 'commandGlobal', 'debugNet') },
				{ label: Util.translate('electronMenuDebugLog'), click: () => Util.send(this.win, 'commandGlobal', 'debugLog') },
				{ label: Util.translate('electronMenuDebugProfiler'), click: () => Util.send(this.win, 'commandGlobal', 'debugProfiler') },
				{ label: Util.translate('electronMenuDebugReport'), click: (item: Electron.MenuItem, window: BrowserWindow | undefined, event: Electron.KeyboardEvent) => {
					const full = event && (event as Electron.KeyboardEvent & { altKey?: boolean }).altKey;
					Util.send(this.win, 'commandGlobal', 'debugReport', { full });
				}},

				Separator,

				{ label: Util.translate('electronMenuDevTools'), accelerator: 'Alt+CmdOrCtrl+I', click: () => this.getView()?.webContents.toggleDevTools() },
			]
		});

		const channels = ConfigManager.getChannels().map((it) => ({
			...it,
			click: () => {
				if (!UpdateManager.isUpdating) {
					Util.send(this.win, 'commandGlobal', 'releaseChannel', it.id);
				};
			},
		}));

		if (channels.length > 1) {
			menuParam.push({ label: Util.translate('electronMenuVersion'), submenu: channels });
		};

		const menuSudo: Electron.MenuItemConstructorOptions = {
			label: 'Sudo',
			submenu: [
				Separator,

				{
					label: 'Experimental features', type: 'checkbox', checked: config.experimental,
					click: () => {
						Api.setConfig(this.win, { experimental: !config.experimental });
						this.win.reload();
						this.getView().webContents.reload();
					}
				},

				Separator,

				{ label: 'Export templates', click: () => Util.send(this.win, 'commandGlobal', 'exportTemplates') },
				{ label: 'Export objects', click: () => Util.send(this.win, 'commandGlobal', 'exportObjects') },
				{ label: 'Export localstore', click: () => Util.send(this.win, 'commandGlobal', 'exportLocalstore') },

				Separator,

				{ label: 'Reset onboarding', click: () => Util.send(this.win, 'commandGlobal', 'resetOnboarding') },
				{ label: 'Read all messages', click: () => Util.send(this.win, 'commandGlobal', 'readAllMessages') },

				Separator,

				{ label: 'Relaunch', click: () => Api.exit(this.win, '', true) },
			]
		};

		if (config.sudo) {
			menuParam.push(menuSudo);
		};

		this.menu = Menu.buildFromTemplate(menuParam);
		Menu.setApplicationMenu(this.menu);
	};

	initDock (): void {
		if (!is.macos) {
			return;
		};



		app.dock.setMenu(Menu.buildFromTemplate([
			{ label: Util.translate('electronMenuNewWindow'), click: () => WindowManager.createMain({ isChild: true }) },
		]));
	};

	initTray (): void {
		const { config } = ConfigManager;



		const isAllowedUpdate = UpdateManager.isAllowed();

		this.destroy();

		if (config.hideTray) {
			return;
		};

		const icon = this.getTrayIcon();

		this.tray = new Tray(this.toTrayImage(icon));
		this.tray.setToolTip('Anytype');
		this.tray.setContextMenu(Menu.buildFromTemplate([
			{ label: Util.translate('electronMenuOpenApp'), click: () => this.winShow() },

			Separator,

			{ label: Util.translate('electronMenuNewWindow'), accelerator: this.getAccelerator('newWindow'), click: () => WindowManager.createMain({ isChild: true }) },

			Separator,

			{ label: Util.translate('electronMenuCheckUpdates'), click: () => { this.winShow(); Api.updateCheck(this.win); }, visible: isAllowedUpdate },
			{ label: Util.translate('commonSettings'), submenu: this.menuSettings() },

			Separator,

			{ label: Util.translate('electronMenuQuit'), click: () => { this.winHide(); Api.exit(this.win, '', false, false); } },
		]));

		// Force on top and focus because in some case Electron fail with this.winShow()
		this.tray.on('double-click', () => {
			if (this.win && !this.win.isDestroyed()) {
				this.win.setAlwaysOnTop(true);
				this.winShow();
				this.win.setAlwaysOnTop(false);
			};
		});
	};

	winShow (): void {
		if (this.win && !this.win.isDestroyed()) {
			this.win.show();
		};
	};

	winHide (): void {
		if (this.win && !this.win.isDestroyed()) {
			this.win.hide();
		};
	};

	menuSettings (): Electron.MenuItemConstructorOptions[] {
		const { config } = ConfigManager;

		const Locale = JSON.parse(fs.readFileSync(path.join(__dirname, 'dist', 'lib', 'json', 'locale.json'), 'utf8'));
		const lang = Util.getLang();
		const langMenu: Electron.MenuItemConstructorOptions[] = [];

		for (const key of Util.enabledLangs()) {
			langMenu.push({
				label: Locale[key], type: 'checkbox', checked: key == lang,
				click: () => Util.send(this.win, 'commandGlobal', 'interfaceLang', key)
			});
		};

		return [
			{
				label: Util.translate('electronMenuAccountSettings'), click: () => {
					this.winShow();
					this.openSettings('account');
				}
			},
			{
				label: Util.translate('electronMenuSpaceSettings'), click: () => {
					this.winShow();
					this.openSettings('spaceIndex');
				}
			},

			Separator,

			{
				label: Util.translate('electronMenuImport'), click: () => {
					this.winShow();
					this.openSettings('importIndex');
				}
			},
			{
				label: Util.translate('electronMenuExport'), click: () => {
					this.winShow();
					this.openSettings('exportIndex');
				}
			},

			{ label: Util.translate('electronMenuLanguage'), submenu: langMenu },

			Separator,

			{
				label: Util.translate('electronMenuShowTray'), type: 'checkbox', checked: !config.hideTray, click: () => {
					Api.setConfig(this.win, { hideTray: !config.hideTray });
					this.initTray();
				}
			},

			(is.windows || is.linux) ? {
				label: Util.translate('electronMenuShowMenu'), type: 'checkbox', checked: config.showMenuBar, click: () => {
					const { config } = ConfigManager;

					Api.setMenuBarVisibility(this.win, !config.showMenuBar);
					this.initTray();
				}
			} : null,

			Separator,

			{
				label: Util.translate('commonNewObject'), accelerator:this.getAccelerator('createObject'), click: () => {
					this.winShow();
					Util.send(this.win, 'commandGlobal', 'createObject');
				}
			},
		].filter(it => it) as Electron.MenuItemConstructorOptions[];
	};

	openSettings (page: string): void {
		if (!Api.hasPinSet || Api.isPinChecked) {
			Util.send(this.win, 'route', `/main/settings/${page}`);
		};
	};

	updateTrayIcon (): void {
		if (this.tray && this.tray.setImage) {
			const icon = this.getTrayIcon();
			if (icon) {
				this.tray.setImage(this.toTrayImage(icon));
			};
		};
	};

	getTrayIcon (): string {
		let icon = '';

		if (is.windows) {
			icon = path.join('icons', '256x256.ico');
		} else
		if (is.linux) {
			const env = (process.env.XDG_CURRENT_DESKTOP || process.env.ORIGINAL_XDG_CURRENT_DESKTOP || '').toUpperCase();
			const panelAlwaysDark = env.includes('GNOME') || (env == 'UNITY'); // for GNOME shell env, including ubuntu -- the panel is always dark

			if (panelAlwaysDark) {
				icon = 'iconTrayWhite.png';
			} else
			if (Util.getTheme() == 'dark') {
				icon = 'iconTrayWhite.png';
			} else {
				icon = 'iconTrayBlack.png';
			};
		} else
		if (is.macos) {
			icon = `iconTrayTemplate.png`;
		};

		return icon ? fixPathForAsarUnpack(path.join(Util.imagePath(), icon)) : '';
	};

	// Wrap the resolved icon path in a NativeImage so Electron streams the bytes
	// to libappindicator/SNI as a managed temp file instead of forwarding the
	// asar.unpacked path. Electron 40+ on GNOME falls back to a generic icon
	// when libappindicator cannot resolve the raw path.
	toTrayImage (iconPath: string): Electron.NativeImage | string {
		if (!iconPath || !is.linux) {
			return iconPath;
		};

		const image = nativeImage.createFromPath(iconPath);
		return image.isEmpty() ? iconPath : image;
	};

	destroy (): void {
		if (this.tray && !this.tray.isDestroyed()) {
			this.tray.destroy();
			this.tray = null;
		};
	};

};

export default new MenuManager();
