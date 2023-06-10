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
	menu = {};
	tray = {};

	setWindow (win) {
		this.win = win;
	};

	initMenu () {
		const { config } = ConfigManager;
		const Api = require('./api.js');
		const WindowManager = require('./window.js');
		const UpdateManager = require('./update.js');

		let menuParam = [
			{
				label: 'Anytype',
				submenu: [
					{ label: 'About Anytype', click: () => { WindowManager.createAbout(); } },

					Separator,

					{ role: 'services' },

					Separator,

					{ role: 'hide', label: 'Hide Anytype' },
					{ role: 'hideothers' },
					{ role: 'unhide' },

					Separator,

					{ label: 'Check for updates', click: () => { Api.updateCheck(this.win); } },
					{ label: 'Settings', click: () => { this.openSettings('account'); } },

					Separator,

					{ label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => { Api.exit(this.win, false); } },
				]
			},
			{
				role: 'fileMenu',
				submenu: [
					{ label: 'Show work directory', click: () => { shell.openPath(userPath); } },
					{ label: 'Show logs', click: () => { shell.openPath(logPath); } },

					Separator,
					{ label: 'Import', click: () => { this.openSettings('importIndex'); } },
					{ label: 'Export', click: () => { this.openSettings('exportIndex'); } },
					{ label: 'Save as file', click: () => { Util.send(this.win, 'commandGlobal', 'save'); } },

					Separator,

					{ label: 'Space debug', click: () => { Util.send(this.win, 'commandGlobal', 'debugSpace'); } },
					{ label: 'Current object debug', click: () => { this.win.show(); Util.send(this.win, 'commandGlobal', 'debugTree'); } },

					Separator,

					{ role: 'close' },
				]
			},
			{
				role: 'editMenu',
				submenu: [
					{
						label: 'Undo', accelerator: 'CmdOrCtrl+Z',
						click: () => { 
							if (this.win) {
								this.win.webContents.undo();
								Util.send(this.win, 'commandGlobal', 'undo');
							};
						}
					},
					{
						label: 'Redo', accelerator: 'CmdOrCtrl+Shift+Z',
						click: () => {
							if (this.win) {
								this.win.webContents.redo();
								Util.send(this.win, 'commandGlobal', 'redo');
							};
						}
					},

					Separator,

					{ label: 'Copy', role: 'copy' },
					{ label: 'Cut', role: 'cut' },
					{ label: 'Paste', role: 'paste' },

					Separator,

					{
						label: 'Select all', accelerator: 'CmdOrCtrl+A',
						click: () => {
							if (this.win) {
								this.win.webContents.selectAll();
								Util.send(this.win, 'commandEditor', 'selectAll');
							};
						}
					},
					{
						label: 'Search', accelerator: 'CmdOrCtrl+F',
						click: () => { Util.send(this.win, 'commandGlobal', 'search'); }
					},

					Separator,

					{
						label: 'Print', accelerator: 'CmdOrCtrl+P',
						click: () => { Util.send(this.win, 'commandGlobal', 'print'); }
					},
				]
			},
			{
				role: 'windowMenu',
				submenu: [
					{ 
						label: 'New window', accelerator: 'CmdOrCtrl+Shift+N',
						click: () => { WindowManager.createMain({ isChild: true }); } 
					},
					{ 
						label: 'New object', accelerator: 'CmdOrCtrl+Alt+N',
						click: () => { WindowManager.createMain({ route: '/main/create', isChild: true }); } 
					},

					Separator,

					{ role: 'minimize' },
					{
						label: 'Zoom in', accelerator: 'CmdOrCtrl+=',
						click: () => { Api.setZoom(this.win, this.win.webContents.getZoomLevel() + 1); }
					},
					{
						label: 'Zoom out', accelerator: 'CmdOrCtrl+-',
						click: () => { Api.setZoom(this.win, this.win.webContents.getZoomLevel() - 1); }
					},
					{
						label: 'Default zoom', accelerator: 'CmdOrCtrl+0',
						click: () => { Api.setZoom(this.win, 0); }
					},
					{
						label: 'Fullscreen', accelerator: 'CmdOrCtrl+Alt+F', type: 'checkbox', checked: this.win.isFullScreen(),
						click: () => { this.win.setFullScreen(!this.win.isFullScreen()); }
					},
					{ label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => { this.win.reload(); } }
				]
			},
			{
				label: 'Help',
				submenu: [
					{
						label: `What's new (${app.getVersion()})`,
						click: () => { Util.send(this.win, 'popup', 'help', { preventResize: true, data: { document: 'whatsNew' } }); }
					},
					{
						label: 'Shortcuts', accelerator: 'Ctrl+Space',
						click: () => { Util.send(this.win, 'popup', 'shortcut', { preventResize: true }); }
					},

					Separator,

					{ label: 'Anytype Community', click: () => { Util.send(this.win, 'commandGlobal', 'community'); } },
					{ label: 'Help and Tutorials', click: () => { Util.send(this.win, 'commandGlobal', 'tutorial'); } },
					{ label: 'Contact Us', click: () => { Util.send(this.win, 'commandGlobal', 'contact'); } },
					{ label: 'Technical Information', click: () => { Util.send(this.win, 'commandGlobal', 'tech'); } },

					Separator,

					{ label: 'Terms of Use', click: () => { Util.send(this.win, 'commandGlobal', 'terms'); } },
					{ label: 'Privacy Policy', click: () => { Util.send(this.win, 'commandGlobal', 'privacy'); } },

				]
			},
		];

		//if (config.allowDebug || config.allowBeta) {
			config.debug = config.debug || {};

			const flags = { 
				ui: 'Interface', 
				ho: 'Hidden objects', 
				mw: 'Middleware', 
				th: 'Threads', 
				fi: 'Files', 
				an: 'Analytics', 
				js: 'JSON',
			};
			const flagMenu = [];

			for (let i in flags) {
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
				label: 'Debug',
				submenu: [
					{ label: 'Flags', submenu: flagMenu },
					{ label: 'Dev Tools', accelerator: 'Alt+CmdOrCtrl+I', click: () => { this.win.webContents.openDevTools(); } },
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
			menuParam.push({ label: 'Version', submenu: channels });
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
					label: 'Export templates',
					click: () => { Util.send(this.win, 'commandGlobal', 'exportTemplates'); }
				},
				{
					label: 'Export objects',
					click: () => { Util.send(this.win, 'commandGlobal', 'exportObjects'); }
				},
				{
					label: 'Export localstore',
					click: () => { Util.send(this.win, 'commandGlobal', 'exportLocalstore'); }
				},

				Separator,
				{
					label: 'Reset onboarding',
					click: () => { Util.send(this.win, 'commandGlobal', 'resetOnboarding'); }
				},

				Separator,

				{
					label: 'Relaunch',
					click: () => { Api.exit(this.win, true); }
				},
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
		const UpdateManager = require('./update.js');

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

		this.tray = new Tray (this.getTrayIcon());
		this.tray.setToolTip('Anytype');
		this.tray.setContextMenu(Menu.buildFromTemplate([
			{ label: 'Open Anytype', click: () => { show(); } },

			Separator,

			{ label: 'Settings', click: () => { show(); this.openSettings(''); } },
			{ label: 'Check for updates', click: () => { show(); Api.updateCheck(this.win); } },

			Separator,

			{ label: 'Import', click: () => { show(); this.openSettings('importIndex'); } },
			{ label: 'Export', click: () => { show(); this.openSettings('exportIndex'); } },
			
			Separator,

			{ label: 'New object', accelerator: 'CmdOrCtrl+N', click: () => { show(); Util.send(this.win, 'commandGlobal', 'create'); } },
			{ label: 'Search object', click: () => { show(); Util.send(this.win, 'popup', 'search', {}, true); } },
			
			Separator,

			{ label: 'Space debug', click: () => { show(); Util.send(this.win, 'commandGlobal', 'debugSpace'); } },
			{ label: 'Tree diagnostics', click: () => { show(); Util.send(this.win, 'commandGlobal', 'debugTree'); } },

			Separator,

			{ label: 'Quit', click: () => { hide(); Api.exit(this.win, false); } },
		]));
	};

	openSettings (page) {
		const Api = require('./api.js');

		if (Api.isPinChecked) {
			Util.send(this.win, 'popup', 'settings', { data: { page } }, true); 
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
			icon = 'icon64x64.png';
		} else 
		if (is.linux) {
			icon = 'icon-tray-white.png';
		} else {
			icon = `icon-tray-${(Util.isDarkTheme() ? 'white' : 'black')}.png`;
		};
		return path.join(Util.imagePath(), icon);
	};

};

module.exports = new MenuManager();