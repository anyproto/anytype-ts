const { app, shell, Menu, Tray } = require('electron');
const { is } = require('electron-util');
const path = require('path');

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
					{ label: 'Settings', click: () => { Util.send(this.win, 'popup', 'settings', { page: 'index' }, true); } },

					Separator,

					{ label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => { Api.exit(this.win, false); } },
				]
			},
			{
				role: 'fileMenu',
				submenu: [
					/*
					{ 
						label: 'New window', accelerator: 'CmdOrCtrl+Shift+N',
						click: () => { WindowManager.createMain({ isChild: true }); } 
					},

					Separator,
					*/

					{ label: 'Show work directory', click: () => { shell.openPath(app.getPath('userData')); } },
					{
						label: 'Import',
						click: () => { Util.send(this.win, 'popup', 'settings', { data: { page: 'importIndex' } }); }
					},
					{
						label: 'Export',
						click: () => { Util.send(this.win, 'popup', 'settings', { data: { page: 'exportMarkdown' } }); }
					},
					{ label: 'Save as file', click: () => { Util.send(this.win, 'command', 'save'); } },

					Separator,

					{ label: 'Space debug', click: () => { Util.send(this.win, 'command', 'debugSpace'); } },
					{ label: 'Current object debug', click: () => { this.win.show(); Util.send(this.win, 'command', 'debugTree'); } },

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
								Util.send(this.win, 'command', 'undo');
							};
						}
					},
					{
						label: 'Redo', accelerator: 'CmdOrCtrl+Shift+Z',
						click: () => {
							if (this.win) {
								this.win.webContents.redo();
								Util.send(this.win, 'command', 'redo');
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
					{ label: 'Anytype ID', click: () => { Util.send(this.win, 'commandGlobal', 'id'); } },
					{
						label: 'Shortcuts', accelerator: 'Ctrl+Space',
						click: () => { Util.send(this.win, 'popup', 'shortcut'); }
					},
					{
						label: 'What\'s new',
						click: () => { Util.send(this.win, 'popup', 'help', { data: { document: 'whatsNew' } }); }
					},
				]
			},
		];

		if (config.allowDebug || config.allowBeta) {
			config.debug = config.debug || {};

			const flags = { 
				ui: 'Interface', 
				ho: 'Hidden objects', 
				mw: 'Middleware', 
				th: 'Threads', 
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
		};

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
					click: () => { Util.send(this.win, 'command', 'exportTemplates'); }
				},
				{
					label: 'Export objects',
					click: () => { Util.send(this.win, 'command', 'exportObjects'); }
				},
				{
					label: 'Export localstore',
					click: () => { Util.send(this.win, 'command', 'exportLocalstore'); }
				},
				{
					label: 'Import account',
					click: () => { Util.send(this.win, 'command', 'importAccount'); }
				},

				Separator,

				{
					label: 'Create workspace',
					click: () => { Util.send(this.win, 'commandGlobal', 'workspace');	}
				},
				{
					label: 'Save page as HTML',
					click: () => { Util.send(this.win, 'command', 'saveAsHTML');	}
				},
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

			{ label: 'Settings', click: () => { show(); Util.send(this.win, 'popup', 'settings', {}, true); } },
			{ label: 'Check for updates', click: () => { show(); UpdateManager.checkUpdate(false); } },

			Separator,

			{ label: 'Import', click: () => { show(); Util.send(this.win, 'popup', 'settings', { data: { page: 'importIndex' } }, true); } },
			{ label: 'Export', click: () => { show(); Util.send(this.win, 'popup', 'settings', { data: { page: 'exportMarkdown' } }, true); } },
			
			Separator,

			{ label: 'New object', click: () => { show(); Util.send(this.win, 'command', 'create'); } },
			{ label: 'Search object', click: () => { show(); Util.send(this.win, 'popup', 'search', { preventResize: true }, true); } },
			
			Separator,

			{ label: 'Space debug', click: () => { show(); Util.send(this.win, 'command', 'debugSync'); } },
			{ label: 'Tree diagnostics', click: () => { show(); Util.send(this.win, 'command', 'debugTree'); } },

			Separator,

			{ label: 'Quit', click: () => { hide(); Api.exit(this.win, false); } },
		]));
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