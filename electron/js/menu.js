const { app, shell, Menu, Tray } = require('electron');
const { is } = require('electron-util');
const path = require('path');
const ConfigManager = require('./config.js');
const Util = require('./util.js');

const Separator = { type: 'separator' };

class MenuManager {

	win = null;
	menu = null;
	tray = null;

	setWindow (win) {
		this.win = win;
	};

	initMenu () {
		const { config } = ConfigManager;
		const Api = require('./api.js');
		const WindowManager = require('./window.js');
		const UpdateManager = require('./update.js');

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

					Separator,

					{ label: Util.translate('electronMenuCheckUpdates'), click: () => Api.updateCheck(this.win) },

					Separator,

					{ label: Util.translate('commonSettings'), submenu: this.menuSettings() },

					Separator,

					{ label: Util.translate('electronMenuQuit'), accelerator: 'CmdOrCtrl+Q', click: () => Api.exit(this.win, false) },
				]
			},
			{
				role: 'fileMenu', label: Util.translate('electronMenuFile'),
				submenu: [
					{ label: Util.translate('commonNewObject'), accelerator: 'CmdOrCtrl+N', click: () => Util.send(this.win, 'commandGlobal', 'createObject') },
					{ label: Util.translate('commonNewSpace'), click: () => Util.send(this.win, 'commandGlobal', 'createSpace') },

					Separator,

					{ label: Util.translate('electronMenuImport'), click: () => this.openSettings('importIndex', { data: { isSpace: true }, className: 'isSpace' }) },
					{ label: Util.translate('electronMenuExport'), click: () => this.openSettings('exportIndex', { data: { isSpace: true }, className: 'isSpace' }) },
					{ label: Util.translate('electronMenuSaveAs'), click: () => Util.send(this.win, 'commandGlobal', 'save') },

					Separator,

					{ 
						label: Util.translate('electronMenuDirectory'), submenu: [
							{ label: Util.translate('electronMenuWorkDirectory'), click: () => shell.openPath(Util.userPath()) },
							{ label: Util.translate('electronMenuDataDirectory'), click: () => shell.openPath(Util.dataPath()) },
							{ label: Util.translate('electronMenuConfigDirectory'), click: () => shell.openPath(Util.defaultUserDataPath()) },
							{ label: Util.translate('electronMenuLogsDirectory'), click: () => shell.openPath(Util.logPath()) },
						] 
					},

					Separator,

					{ role: 'close', label: Util.translate('electronMenuClose') },
				]
			},
			{
				label: Util.translate('electronMenuEdit'),
				submenu: [
					{
						label: Util.translate('electronMenuUndo'), accelerator: 'CmdOrCtrl+Z',
						click: () => { 
							if (this.win) {
								this.win.webContents.undo();
								Util.send(this.win, 'commandGlobal', 'undo');
							};
						}
					},
					{
						label: Util.translate('electronMenuRedo'), accelerator: 'CmdOrCtrl+Shift+Z',
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
						click: () => Util.send(this.win, 'commandEditor', 'pastePlain'),
					},

					Separator,

					{
						label: Util.translate('electronMenuSelectAll'), accelerator: 'CmdOrCtrl+A',
						click: () => {
							if (this.win) {
								this.win.webContents.selectAll();
								Util.send(this.win, 'commandEditor', 'selectAll');
							};
						}
					},
					{ label: Util.translate('electronMenuSearch'), accelerator: 'CmdOrCtrl+F', click: () => Util.send(this.win, 'commandGlobal', 'search') },

					Separator,

					{ label: Util.translate('electronMenuPrint'), accelerator: 'CmdOrCtrl+P', click: () => Util.send(this.win, 'commandGlobal', 'print') },
				]
			},
			{
				role: 'windowMenu', label: Util.translate('electronMenuWindow'),
				submenu: [
					{ label: Util.translate('electronMenuNewWindow'), accelerator: 'CmdOrCtrl+Shift+N', click: () => WindowManager.createMain({ isChild: true }) },

					Separator,

					{ role: 'minimize', label: Util.translate('electronMenuMinimise') },
					{ label: Util.translate('electronMenuZoomIn'), accelerator: 'CmdOrCtrl+=', click: () => Api.setZoom(this.win, this.win.webContents.getZoomLevel() + 1) },
					{ label: Util.translate('electronMenuZoomOut'), accelerator: 'CmdOrCtrl+-', click: () => Api.setZoom(this.win, this.win.webContents.getZoomLevel() - 1) },
					{ label: Util.translate('electronMenuZoomDefault'), accelerator: 'CmdOrCtrl+0', click: () => Api.setZoom(this.win, 0) },
					{
						label: Util.translate('electronMenuFullscreen'), accelerator: (is.macos ? 'Cmd+Ctrl+F' : 'Ctrl+Alt+F'), type: 'checkbox', checked: this.win.isFullScreen(),
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
						click: () => Util.send(this.win, 'popup', 'help', { preventResize: true, data: { document: 'whatsNew' } })
					},
					{
						label: Util.translate('electronMenuShortcuts'), accelerator: 'Ctrl+Space',
						click: () => Util.send(this.win, 'popup', 'shortcut', { preventResize: true })
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
					
					if ([ 'ho' ].includes(i)) {
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

				Separator,

				{ label: Util.translate('electronMenuDevTools'), accelerator: 'Alt+CmdOrCtrl+I', click: () => this.win.toggleDevTools() },
			]
		});

		const channels = ConfigManager.getChannels().map(it => {
			it.click = () => { 
				if (!UpdateManager.isUpdating) {
					UpdateManager.setChannel(it.id); 
					Api.setConfig(this.win, { channel: it.id });
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
		const Api = require('./api.js');

		this.destroy();

		if (config.hideTray) {
			return;
		};

		this.tray = new Tray (this.getTrayIcon());
		this.tray.setToolTip('Anytype');
		this.tray.setContextMenu(Menu.buildFromTemplate([
			{ label: Util.translate('electronMenuOpen'), click: () => this.winShow() },

			Separator,

			{ label: Util.translate('electronMenuCheckUpdates'), click: () => { this.winShow(); Api.updateCheck(this.win); } },
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
					this.openSettings('spaceIndex', { data: { isSpace: true }, className: 'isSpace' }); 
				}
			},

			Separator,

			{ 
				label: Util.translate('electronMenuImport'), click: () => { 
					this.winShow(); 
					this.openSettings('importIndex', { data: { isSpace: true }, className: 'isSpace' }); 
				} 
			},
			{ 
				label: Util.translate('electronMenuExport'), click: () => { 
					this.winShow(); 
					this.openSettings('exportIndex', { data: { isSpace: true }, className: 'isSpace' }); 
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
				label: Util.translate('electronMenuShowMenu'), type: 'checkbox', checked: !config.hideMenuBar, click: () => {
					Api.setConfig(this.win, { hideMenuBar: !config.hideMenuBar });
					this.win.setMenuBarVisibility(!config.hideMenuBar);
					this.win.setAutoHideMenuBar(!config.hideMenuBar);
					this.initTray();
				}
			} : null,

			Separator,

			{ 
				label: Util.translate('commonNewObject'), accelerator: 'CmdOrCtrl+N', click: () => { 
					this.winShow();
					Util.send(this.win, 'commandGlobal', 'createObject'); 
				} 
			},
		].filter(it => it);
	};

	openSettings (page, param) {
		param = param || {};
		param.data = param.data || {};

		const Api = require('./api.js');

		if (Api.isPinChecked) {
			const popupParam = Object.assign({}, param);
			popupParam.data = Object.assign({ page }, param.data);

			Util.send(this.win, 'popup', 'settings', popupParam, true); 
		};
	};

	updateTrayIcon () {
		if (this.tray && this.tray.setImage) {
			this.tray.setImage(this.getTrayIcon());
		};
	};

	getTrayIcon () {
		let icon = '';
		if (is.windows) {
			icon = 'icon32x32.png';
		} else 
		if (is.linux) {
			icon = 'iconTrayWhite.png';
		} else {
			icon = `iconTrayTemplate.png`;
		};
		return path.join(Util.imagePath(), icon);
	};

	destroy () {
		if (this.tray && !this.tray.isDestroyed()) {
			this.tray.destroy();
			this.tray = null;
		};
	};

};

module.exports = new MenuManager();
