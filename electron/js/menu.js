const { app, shell, Menu, Tray } = require('electron');
const { is } = require('electron-util');
const fs = require('fs');
const path = require('path');
const ConfigManager = require('./config.js');
const Util = require('./util.js');
const Separator = { type: 'separator' };

const DEFAULT_SHORTCUTS = {
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
	toggleFullscreen: [ 'CmdOrCtrl', 'Shift', 'F' ],
	shortcut: [ 'Ctrl', 'Space' ],
};

class MenuManager {

	win = null;
	menu = null;
	tray = null;
	store = null;

	setWindow (win) {
		this.win = win;
	};

	initShortcuts () {
		this.shortcuts = this.store.get('shortcuts') || {};
	};

	getAccelerator (id) {
		let keys = this.shortcuts[id];

		if (undefined === keys) {
			return (DEFAULT_SHORTCUTS[id] || []).join('+');
		};

		keys = keys || [];

		const ret = [];
		for (const key of keys) {
			if (key == 'ctrl') {
				ret.push('CmdOrCtrl');
			} else
			if (key == 'shift') {
				ret.push('Shift');
			} else
			if (key == 'alt') {
				ret.push('Alt');
			} else {
				ret.push(key.toUpperCase());
			};
		};
		return ret.join('+');
	};

	initMenu () {
		this.initShortcuts();

		const { config } = ConfigManager;
		const Api = require('./api.js');
		const WindowManager = require('./window.js');
		const UpdateManager = require('./update.js');
		const isAllowedUpdate = UpdateManager.isAllowed();

		config.debug = config.debug || {};
		config.flagsMw = config.flagsMw || {};

		const menuParam = [
			{
				label: 'Anytype',
				submenu: [
					{ label: Util.translate('electronMenuAbout'), click: () => Util.send(this.win, 'popup', 'about', {}, true) },

					Separator,

					{ role: 'hide', label: Util.translate('electronMenuHide') },
					{ role: 'hideothers', label: Util.translate('electronMenuHideOthers') },
					{ role: 'unhide', label: Util.translate('electronMenuUnhide') },

					{ type: 'separator', visible: isAllowedUpdate },
					{ label: Util.translate('electronMenuCheckUpdates'), click: () => Api.updateCheck(this.win), visible: isAllowedUpdate },

					Separator,

					{ label: Util.translate('commonSettings'), submenu: this.menuSettings() },

					Separator,

					{ label: Util.translate('electronMenuQuit'), accelerator: 'CmdOrCtrl+Q', click: () => Api.exit(this.win, false) },
				]
			},
			{
				role: 'fileMenu', label: Util.translate('electronMenuFile'),
				submenu: [
					{ label: Util.translate('commonNewObject'), accelerator: this.getAccelerator('createObject'), click: () => Util.send(this.win, 'commandGlobal', 'createObject') },
					{ label: Util.translate('commonNewSpace'), click: () => Util.send(this.win, 'commandGlobal', 'createSpace') },

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

					{ role: 'close', label: Util.translate('electronMenuClose') },
				]
			},
			{
				label: Util.translate('electronMenuEdit'),
				submenu: [
					{
						label: Util.translate('electronMenuUndo'), accelerator: this.getAccelerator('undo'),
						click: () => { 
							if (this.win) {
								this.win.webContents.undo();
								Util.send(this.win, 'commandGlobal', 'undo');
							};
						}
					},
					{
						label: Util.translate('electronMenuRedo'), accelerator: this.getAccelerator('redo'),
						click: () => {
							if (this.win) {
								this.win.webContents.redo();
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
								this.win.webContents.selectAll();
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

					Separator,

					{ role: 'minimize', label: Util.translate('electronMenuMinimise') },
					{ label: Util.translate('electronMenuZoomIn'), accelerator: this.getAccelerator('zoomIn'), click: () => Api.setZoom(this.win, this.win.webContents.getZoomLevel() + 1) },
					{ label: Util.translate('electronMenuZoomOut'), accelerator: this.getAccelerator('zoomOut'), click: () => Api.setZoom(this.win, this.win.webContents.getZoomLevel() - 1) },
					{ label: Util.translate('electronMenuZoomDefault'), accelerator: this.getAccelerator('zoomReset'), click: () => Api.setZoom(this.win, 0) },
					{
						label: Util.translate('electronMenuFullscreen'), accelerator: this.getAccelerator('toggleFullscreen'), type: 'checkbox', checked: this.win.isFullScreen(),
						click: () => this.win.setFullScreen(!this.win.isFullScreen())
					},
					{ label: Util.translate('electronMenuReload'), accelerator: 'CmdOrCtrl+R', click: () => this.win.reload() }
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

					Separator,

					{ label: Util.translate('electronMenuTerms'), click: () => Util.send(this.win, 'commandGlobal', 'terms') },
					{ label: Util.translate('electronMenuPrivacy'), click: () => Util.send(this.win, 'commandGlobal', 'privacy') },

				]
			},
		];

		const flags = { 
			ui: Util.translate('electronMenuFlagInterface'), 
			hiddenObject: Util.translate('electronMenuFlagHidden'), 
			analytics: Util.translate('electronMenuFlagAnalytics'),
		};

		const flagsMw = {
			request: Util.translate('electronMenuFlagMwRequest'),
			event: Util.translate('electronMenuFlagMwEvent'),
			sync: Util.translate('electronMenuFlagMwSync'),
			file: Util.translate('electronMenuFlagMwFile'),
			time: Util.translate('electronMenuFlagMwTime'),
			json: Util.translate('electronMenuFlagMwJson'),
		};

		const flagMenu = [];
		const flagMwMenu = [];

		for (const i in flags) {
			flagMenu.push({
				label: flags[i], type: 'checkbox', checked: config.debug[i],
				click: () => {
					config.debug[i] = !config.debug[i];
					Api.setConfig(this.win, { debug: config.debug });
					
					if ([ 'hiddenObject' ].includes(i)) {
						this.win.reload();
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
				{ label: Util.translate('electronMenuDebugObject'), click: () => Util.send(this.win, 'commandGlobal', 'debugTree') },
				{ label: Util.translate('electronMenuDebugProcess'), click: () => Util.send(this.win, 'commandGlobal', 'debugProcess') },
				{ label: Util.translate('electronMenuDebugStat'), click: () => Util.send(this.win, 'commandGlobal', 'debugStat') },
				{ label: Util.translate('electronMenuDebugReconcile'), click: () => Util.send(this.win, 'commandGlobal', 'debugReconcile') },
				{ label: Util.translate('electronMenuDebugNet'), click: () => Util.send(this.win, 'commandGlobal', 'debugNet') },
				{ label: Util.translate('electronMenuDebugLog'), click: () => Util.send(this.win, 'commandGlobal', 'debugLog') },
				{ label: Util.translate('electronMenuDebugProfiler'), click: () => Util.send(this.win, 'commandGlobal', 'debugProfiler') },

				Separator,

				{ label: Util.translate('electronMenuDevTools'), accelerator: 'Alt+CmdOrCtrl+I', click: () => this.win.toggleDevTools() },
			]
		});

		const channels = ConfigManager.getChannels().map(it => {
			it.click = () => { 
				if (!UpdateManager.isUpdating) {
					Util.send(this.win, 'commandGlobal', 'releaseChannel', it.id);
				};
			};
			return it;
		}); 

		if (channels.length > 1) {
			menuParam.push({ label: Util.translate('electronMenuVersion'), submenu: channels });
		};

		const menuSudo = { 
			label: 'Sudo',
			submenu: [
				Separator,

				{
					label: 'Experimental features', type: 'checkbox', checked: config.experimental,
					click: () => { 
						Api.setConfig(this.win, { experimental: !config.experimental });
						this.win.reload();
					}
				},

				Separator,

				{
					label: 'Test payments', type: 'checkbox', checked: config.testPayment,
					click: () => {
						Api.setConfig(this.win, { testPayment: !config.testPayment });
						this.win.reload();
					}
				},

				Separator,

				{ label: 'Export templates', click: () => Util.send(this.win, 'commandGlobal', 'exportTemplates') },
				{ label: 'Export objects', click: () => Util.send(this.win, 'commandGlobal', 'exportObjects') },
				{ label: 'Export localstore', click: () => Util.send(this.win, 'commandGlobal', 'exportLocalstore') },

				Separator,

				{ label: 'Reset onboarding', click: () => Util.send(this.win, 'commandGlobal', 'resetOnboarding') },

				Separator,

				{ label: 'Relaunch', click: () => Api.exit(this.win, true) },
			]
		};

		if (config.sudo) {
			menuParam.push(menuSudo);
		};

		this.menu = Menu.buildFromTemplate(menuParam);
		Menu.setApplicationMenu(this.menu);
	};

	initTray () {
		const { config } = ConfigManager;
		const WindowManager = require('./window.js');
		const Api = require('./api.js');
		const UpdateManager = require('./update.js');
		const isAllowedUpdate = UpdateManager.isAllowed();

		this.destroy();

		if (config.hideTray) {
			return;
		};

		const icon = this.getTrayIcon();

		this.tray = new Tray (icon);
		this.tray.setToolTip('Anytype');
		this.tray.setContextMenu(Menu.buildFromTemplate([
			{ label: Util.translate('electronMenuOpenApp'), click: () => this.winShow() },

			Separator,

			{ label: Util.translate('electronMenuNewWindow'), accelerator: this.getAccelerator('newWindow'), click: () => WindowManager.createMain({ isChild: true }) },

			Separator,

			{ label: Util.translate('electronMenuCheckUpdates'), click: () => { this.winShow(); Api.updateCheck(this.win); }, visible: isAllowedUpdate },
			{ label: Util.translate('commonSettings'), submenu: this.menuSettings() },
			
			Separator,

			{ label: Util.translate('electronMenuQuit'), click: () => { this.winHide(); Api.exit(this.win, '', false); } },
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

	winShow () {
		if (this.win && !this.win.isDestroyed()) {
			this.win.show();
		};
	};

	winHide () {
		if (this.win && !this.win.isDestroyed()) {
			this.win.hide();
		};
	};

	menuSettings () {
		const { config } = ConfigManager;
		const Api = require('./api.js');
		const Locale = require('../../dist/lib/json/locale.json');
		const lang = Util.getLang();
		const langMenu = [];

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
					this.openSettings(''); 
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
		].filter(it => it);
	};

	openSettings (page) {
		const Api = require('./api.js');

		if (Api.isPinChecked) {
			Util.send(this.win, 'route', '/main/settings/' + page);
		};
	};

	updateTrayIcon () {
		if (this.tray && this.tray.setImage) {
			const icon = this.getTrayIcon();
			if (icon) {
				this.tray.setImage(icon);
			};
		};
	};

	getTrayIcon () {
		let icon = '';

		if (is.windows) {
			icon = path.join('icons', '32x32.png');
		} else 
		if (is.linux) {
			const env = process.env.ORIGINAL_XDG_CURRENT_DESKTOP;
			const panelAlwaysDark = env.includes('GNOME') || (env == 'Unity'); // for GNOME shell env, including ubuntu -- the panel is always dark

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

		return icon ? path.join(Util.imagePath(), icon) : '';
	};

	destroy () {
		if (this.tray && !this.tray.isDestroyed()) {
			this.tray.destroy();
			this.tray = null;
		};
	};

};

module.exports = new MenuManager();
