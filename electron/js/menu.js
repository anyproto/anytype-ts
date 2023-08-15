const { app, shell, Menu, Tray } = require('electron');
const { is } = require('electron-util');
const path = require('path');
const userPath = app.getPath('userData');
const logPath = path.join(userPath, 'logs');

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
		const Locale = require('../../dist/lib/json/locale.json');
		const lang = Util.getLang();
		const langMenu = [];

		for (const key of Util.enabledLangs()) {
			langMenu.push({
				label: Locale[key], type: 'checkbox', checked: key == lang,
				click: () => Api.changeInterfaceLang(this.win, key)
			});
		};

		const menuParam = [
			{
				label: 'Anytype',
				submenu: [
					{ label: Util.translate('electronMenuAbout'), click: () => WindowManager.createAbout() },

					Separator,

					{ role: 'hide', label: Util.translate('electronMenuHide') },
					{ role: 'hideothers', label: Util.translate('electronMenuHideOthers') },
					{ role: 'unhide', label: Util.translate('electronMenuUnhide') },

					Separator,

					{ label: Util.translate('electronMenuCheckUpdates'), click: () => Api.updateCheck(this.win) },

					Separator,

					{ label: Util.translate('electronMenuSpaceSettings'), click: () => this.openSettings('spaceIndex', { data: { isSpace: true }, className: 'isSpace' }) },
					{ label: Util.translate('electronMenuAccountSettings'), click: () => this.openSettings('') },
					{ label: Util.translate('electronMenuLanguage'), submenu: langMenu },

					Separator,

					{ label: Util.translate('electronMenuQuit'), accelerator: 'CmdOrCtrl+Q', click: () => Api.exit(this.win, false) },
				]
			},
			{
				role: 'fileMenu', label: Util.translate('electronMenuFile'),
				submenu: [
					{ label: Util.translate('electronMenuDirectory'), click: () => { shell.openPath(userPath); } },
					{ label: Util.translate('electronMenuLogs'), click: () => { shell.openPath(logPath); } },

					Separator,
					{ label: Util.translate('electronMenuImport'), click: () => this.openSettings('importIndex', { data: { isSpace: true }, className: 'isSpace' }) },
					{ label: Util.translate('electronMenuExport'), click: () => this.openSettings('exportIndex', { data: { isSpace: true }, className: 'isSpace' }) },
					{ label: Util.translate('electronMenuSaveAs'), click: () => Util.send(this.win, 'commandGlobal', 'save') },

					Separator,

					{ label: Util.translate('electronMenuDebugSpace'), click: () => { Util.send(this.win, 'command', 'debugSpace'); } },
					{ label: Util.translate('electronMenuDebugObject'), click: () => { this.win.show(); Util.send(this.win, 'command', 'debugTree'); } },
					{ 
						label: Util.translate('electronMenuDebugProcess'), 
						click: () => {
							Api.exit(this.win, 'SIGUSR1', true);
							shell.openPath(path.join(Util.dataPath(), Api.account.id, 'logs'));
						}
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
					{ label: Util.translate('electronMenuNewObject'), accelerator: 'CmdOrCtrl+Alt+N', click: () => WindowManager.createMain({ route: '/main/create', isChild: true }) },

					Separator,

					{ role: 'minimize', label: Util.translate('electronMenuMinimise') },
					{ label: Util.translate('electronMenuZoomIn'), accelerator: 'CmdOrCtrl+=', click: () => Api.setZoom(this.win, this.win.webContents.getZoomLevel() + 1) },
					{ label: Util.translate('electronMenuZoomOut'), accelerator: 'CmdOrCtrl+-', click: () => Api.setZoom(this.win, this.win.webContents.getZoomLevel() - 1) },
					{ label: Util.translate('electronMenuZoomDefault'), accelerator: 'CmdOrCtrl+0', click: () => Api.setZoom(this.win, 0) },
					{
						label: Util.translate('electronMenuFullscreen'), accelerator: 'CmdOrCtrl+Alt+F', type: 'checkbox', checked: this.win.isFullScreen(),
						click: () => this.win.setFullScreen(!this.win.isFullScreen())
					},
					{ label: Util.translate('electronMenuReload'), accelerator: 'CmdOrCtrl+R', click: () => this.win.reload() }
				]
			},
			{
				label: Util.translate('electronMenuHelp'),
				submenu: [
					{
						label: Util.translate('electronMenuReleaseNotes') + ` (${app.getVersion()})`,
						click: () => Util.send(this.win, 'popup', 'help', { preventResize: true, data: { document: 'whatsNew' } })
					},
					{
						label: Util.translate('electronMenuShortcuts'), accelerator: 'Ctrl+Space',
						click: () => Util.send(this.win, 'popup', 'shortcut', { preventResize: true })
					},

					Separator,

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

		//if (config.allowDebug || config.allowBeta) {
			config.debug = config.debug || {};

			const flags = { 
				ui: Util.translate('electronMenuFlagInterface'), 
				ho: Util.translate('electronMenuFlagHidden'), 
				mw: Util.translate('electronMenuFlagMiddleware'), 
				th: Util.translate('electronMenuFlagThreads'), 
				fi: Util.translate('electronMenuFlagFiles'), 
				an: Util.translate('electronMenuFlagAnalytics'), 
				js: Util.translate('electronMenuFlagJson'),
			};
			const flagMenu = [];

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

			menuParam.push({
				label: Util.translate('electronMenuDebug'),
				submenu: [
					{ label: Util.translate('electronMenuFlags'), submenu: flagMenu },
					{ label: Util.translate('electronMenuDevTools'), accelerator: 'Alt+CmdOrCtrl+I', click: () => this.win.webContents.openDevTools() },
				]
			});
		//};

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

				{ label: 'Export templates', click: () => Util.send(this.win, 'commandGlobal', 'exportTemplates') },
				{ label: 'Export objects', click: () => Util.send(this.win, 'commandGlobal', 'exportObjects') },
				{ label: 'Export localstore', click: () => { Util.send(this.win, 'commandGlobal', 'exportLocalstore'); } },

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
		const Api = require('./api.js');

		const show = () => {
			if (this.win) {
				this.win.show();
			};
		};

		const hide = () => {
			if (this.win) {
				this.win.hide();
			};
		};

		if (this.tray) {
			this.tray.destroy();
		};

		this.tray = new Tray (this.getTrayIcon());
		this.tray.setToolTip('Anytype');
		this.tray.setContextMenu(Menu.buildFromTemplate([
			{ label: Util.translate('electronMenuOpen'), click: () => show() },

			Separator,

			{ label: Util.translate('electronMenuCheckUpdates'), click: () => { show(); Api.updateCheck(this.win); } },

			Separator,

			{ label: Util.translate('electronMenuSpaceSettings'), click: () => { show(); this.openSettings('spaceIndex', { data: { isSpace: true }, className: 'isSpace' }); } },
			{ label: Util.translate('electronMenuAccountSettings'), click: () => { show(); this.openSettings(''); } },

			Separator,

			{ label: Util.translate('electronMenuImport'), click: () => { show(); this.openSettings('importIndex', { data: { isSpace: true }, className: 'isSpace' }); } },
			{ label: Util.translate('electronMenuExport'), click: () => { show(); this.openSettings('exportIndex', { data: { isSpace: true }, className: 'isSpace' }); } },
			
			Separator,

			{ label: Util.translate('electronMenuNewObject'), accelerator: 'CmdOrCtrl+N', click: () => { show(); Util.send(this.win, 'commandGlobal', 'create'); } },
			{ label: Util.translate('electronMenuSearchObject'), click: () => { show(); Util.send(this.win, 'popup', 'search', {}, true); } },
			
			Separator,

			{ label: Util.translate('electronMenuDebugSpace'), click: () => { show(); Util.send(this.win, 'commandGlobal', 'debugSpace'); } },
			{ label: Util.translate('electronMenuDebugTree'), click: () => { show(); Util.send(this.win, 'commandGlobal', 'debugTree'); } },

			Separator,

			{ label: Util.translate('electronMenuQuit'), click: () => { hide(); Api.exit(this.win, '', false); } },
		]));
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

};

module.exports = new MenuManager();