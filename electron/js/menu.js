const { app, shell, Menu, Tray } = require('electron');

const ConfigManager = require('./config.js');
const Util = require('./util.js');

const Separator = { type: 'separator' };

class MenuManager {

	menu = {};
	tray = {};
	setChannel = () => {};
	setConfig = () => {};

	initMenu (win) {
		const { config } = ConfigManager;

		let menuParam = [
			{
				label: 'Anytype',
				submenu: [
					{ label: 'About Anytype', click: () => { Util.aboutWindow(); } },
					Separator,
					{ role: 'services' },
					Separator,
					{ role: 'hide', label: 'Hide Anytype' },
					{ role: 'hideothers' },
					{ role: 'unhide' },
					Separator,
					{ label: 'Check for updates', click: () => { Updater.checkUpdate(false); } },
					{ label: 'Settings', click: () => { Util.send(win, 'popup', 'settings', {}); } },
					Separator,
					{
						label: 'Quit', accelerator: 'CmdOrCtrl+Q',
						click: () => { 
							if (win) {
								win.hide();
							};
							exit(false); 
						}
					},
				]
			},
			{
				role: 'fileMenu',
				submenu: [
					{ label: 'Show work directory', click: () => { shell.openPath(app.getPath('userData')); } },
					{
						label: 'Import',
						click: () => { Util.send(win, 'popup', 'settings', { data: { page: 'importIndex' } }); }
					},
					{
						label: 'Export',
						click: () => { Util.send(win, 'popup', 'settings', { data: { page: 'exportMarkdown' } }); }
					},
					{ label: 'Save as file', click: () => { Util.send(win, 'command', 'save'); } },

					Separator,

					{ label: 'Object diagnostics', click: () => { Util.send(win, 'debugSync'); } },
					{ label: 'Tree diagnostics', click: () => { win.show(); Util.send(win, 'debugTree'); } },

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
							win.webContents.undo();
							Util.send(win, 'command', 'undo');
						}
					},
					{
						label: 'Redo', accelerator: 'CmdOrCtrl+Shift+Z',
						click: () => {
							win.webContents.redo();
							Util.send(win, 'command', 'redo');
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
							win.webContents.selectAll();
							Util.send(win, 'commandEditor', 'selectAll');
						}
					},
					{
						label: 'Search', accelerator: 'CmdOrCtrl+F',
						click: () => { Util.send(win, 'commandGlobal', 'search'); }
					},
					Separator,
					{
						label: 'Print', accelerator: 'CmdOrCtrl+P',
						click: () => { Util.send(win, 'commandGlobal', 'print'); }
					},
				]
			},
			{
				role: 'windowMenu',
				submenu: [
					{ role: 'minimize' },
					{ role: 'zoom' },
					{
						label: 'Fullscreen', type: 'checkbox', checked: win.isFullScreen(),
						click: () => { win.setFullScreen(!win.isFullScreen()); }
					},
				]
			},
			{
				label: 'Help',
				submenu: [
					{ label: 'Anytype ID', click: () => { Util.send(win, 'commandGlobal', 'id'); } },
					{
						label: 'Shortcuts', accelerator: 'Ctrl+Space',
						click: () => { Util.send(win, 'popup', 'shortcut'); }
					},
					{
						label: 'What\'s new',
						click: () => { Util.send(win, 'popup', 'help', { data: { document: 'whatsNew' } }); }
					},
				]
			},
		];

		if (config.allowDebug) {
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
						this.setConfig({ debug: config.debug });
						
						if ([ 'ho' ].includes(i)) {
							win.reload();
						};
					}
				});
			};

			menuParam.push({
				label: 'Debug',
				submenu: [
					{ label: 'Flags', submenu: flagMenu },
					{
						label: 'Refresh', accelerator: 'CmdOrCtrl+R',
						click: () => { win.reload(); }
					},
					{
						label: 'Dev Tools', accelerator: 'Alt+CmdOrCtrl+I',
						click: () => { win.webContents.openDevTools(); }
					},
				]
			});
		};

		let channelSettings = [
			{ id: 'alpha', name: 'Alpha' },
			{ id: 'beta', name: 'Pre-release' },
			{ id: 'latest', name: 'Public' },
		];

		let channels = channelSettings.map((it) => {
			return { label: it.name, type: 'radio', checked: (config.channel == it.id), click: () => { this.setChannel(it.id); } }
		});
		if (!config.sudo) {
			channels = channels.filter(it => it.id != 'alpha');
		};

		const menuSudo = { 
			label: 'Sudo',
			submenu: [
				{ label: 'Version', submenu: channels },
				{
					label: 'Experimental', type: 'checkbox', checked: config.experimental,
					click: () => { 
						this.setConfig({ experimental: !config.experimental });
						win.reload();
					}
				},
				{
					label: 'Export templates',
					click: () => { Util.send(win, 'command', 'exportTemplates'); }
				},
				{
					label: 'Export objects',
					click: () => { Util.send(win, 'command', 'exportObjects'); }
				},
				{
					label: 'Export localstore',
					click: () => { Util.send(win, 'command', 'exportLocalstore'); }
				},
				{
					label: 'Create workspace',
					click: () => { Util.send(win, 'commandGlobal', 'workspace');	}
				},
				{
					label: 'Save page as HTML',
					click: () => { Util.send(win, 'command', 'saveAsHTML');	}
				},
				{
					label: 'Relaunch',
					click: () => { exit(true); }
				},
			]
		};

		if (config.sudo) {
			menuParam.push(menuSudo);
		};

		this.menu = Menu.buildFromTemplate(menuParam);
		Menu.setApplicationMenu(this.menu);
	};

	initTray (win) {
		const show = () => {
			if (win) {
				win.show();
			};
		};

		const hide = () => {
			if (win) {
				win.hide();
			};
		};

		this.tray = new Tray (this.getTrayIcon());
		this.tray.setToolTip('Anytype');
		this.tray.setContextMenu(Menu.buildFromTemplate([
			{ label: 'Open Anytype', click: () => { show(); } },

			Separator,

			{ label: 'Settings', click: () => { show(); Util.send(win, 'popup', 'settings', {}, true); } },
			{ label: 'Check for updates', click: () => { show(); UpdateManager.checkUpdate(false); } },

			Separator,

			{ label: 'Import', click: () => { show(); Util.send(win, 'popup', 'settings', { data: { page: 'importIndex' } }, true); } },
			{ label: 'Export', click: () => { show(); Util.send(win, 'popup', 'settings', { data: { page: 'exportMarkdown' } }, true); } },
			
			Separator,

			{ label: 'New object', click: () => { show(); Util.send(win, 'command', 'create'); } },
			{ label: 'Search object', click: () => { show(); Util.send(win, 'popup', 'search', { preventResize: true }, true); } },
			
			Separator,

			{ label: 'Object diagnostics', click: () => { show(); Util.send(win, 'debugSync'); } },
			{ label: 'Tree diagnostics', click: () => { show(); Util.send(win, 'debugTree'); } },

			Separator,

			{ label: 'Quit', click: () => { hide(); exit(false); } },
		]));
	};

	updateTrayIcon () {
		if (this.tray) {
			this.tray.setImage(this.getTrayIcon());
		};
	};

	getTrayIcon () {
		const icon = is.windows ? 'icon64x64.png' : `icon-tray-${(Util.isDarkTheme() ? 'white' : 'black')}.png`;
		return path.join(Util.imagePath(), icon);
	};

};

module.exports = new MenuManager();