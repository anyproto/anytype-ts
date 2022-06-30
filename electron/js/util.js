const log = require('electron-log');
const { app, BrowserWindow, shell, nativeTheme } = require('electron');
const { is } = require('electron-util');
const path = require('path');
const version = app.getVersion();

const ConfigManager = require('./config.js');

log.transports.rendererConsole.level = 'error';

class Util {

	appPath = '';

	setPath (value) {
		this.appPath = value;
	};

    log (method, text) {
        if (!log[method]) {
            method = 'info';
        };
        log[method](text);
        console.log(text);
    };

	isDarkTheme () {
		return nativeTheme.shouldUseDarkColors || nativeTheme.shouldUseHighContrastColors || nativeTheme.shouldUseInvertedColorScheme;
	};

	getTheme () {
		const { theme } = ConfigManager.config || {};

		switch (theme) {
			default:
				return theme;

			case 'system':
				return this.isDarkTheme() ? 'dark' : '';
		};
	};

	getBgColor () {
		let theme = this.getTheme();
		let bg = {
			'': '#fff',
			dark: '#2c2b27',
		};
		return bg[theme];
	};

	getDefaultChannel () {
		let c = 'latest';
		if (version.match('alpha')) {
			c = 'alpha';
		};
		if (version.match('beta')) {
			c = 'beta';
		};
		return c;
	};

	imagePath () {
		return path.join(this.appPath, 'electron', 'img' );
	};

	send () {
		const args = [ ...arguments ];
		const win = args[0];

		if (win && win.webContents) {
			args.shift();
			win.webContents.send.apply(win.webContents, args);
		};
	};

	aboutWindow () {
		let window = new BrowserWindow({
			backgroundColor: this.getBgColor(),
			width: 400,
			height: 400,
			useContentSize: true,
			titleBarStyle: 'hidden-inset',
			show: true,
			icon: path.join(__dirname, 'electron', 'img', 'icon.png'),
			webPreferences: {
				nodeIntegration: true,
			},
		});

		window.loadURL('file://' + path.join(__dirname, 'electron', 'about', `index.html?version=${version}&theme=${this.getTheme()}`));

		window.once('closed', () => { window = null; });
		window.once('ready-to-show', () => { window.show(); });
		window.setMenu(null);

		window.webContents.on('will-navigate', (e, url) => {
			e.preventDefault();
			shell.openExternal(url);
		});

		window.webContents.on('new-window', (e, url) => {
			e.preventDefault();
			shell.openExternal(url);
		});

		return window;
	};

	savePage (win, exportPath, name) {
		name = String(name || 'untitled').replace(/[^\w -\._]/gi, '-').toLowerCase();

		let fn = `${name}_files`;
		let filesPath = path.join(exportPath, fn);
		let exportName = path.join(exportPath, name + '.html');

		win.webContents.savePage(exportName, 'HTMLComplete').then(() => {
			let content = fs.readFileSync(exportName, 'utf8');

			// Replace files loaded by url and copy them in page folder
			try {
				content = content.replace(/"(file:\/\/[^"]+)"/g, function (s, p, o) {
					let a = p.split('app.asar/dist/');
					let name = a[1].split('/');

					name = name[name.length - 1];

					let src = p.replace('file://', '').replace(/\?.*/, '');
					let dst = path.join(filesPath, name).replace(/\?.*/, '');

					fs.copyFileSync(src, dst);
					return `./${fn}/${name}`;
				});
			} catch (e) {
				this.log('info', e);
			};

			content = content.replace(/<script[^>]+><\/script>/g, '');

			try {
				const js = [ 'export', 'jquery' ];
				const ap = app.getAppPath();

				js.forEach((it) => {
					fs.copyFileSync(`${ap}/dist/js/${it}.js`, path.join(filesPath, it + '.js'));
				});

				content = content.replace('<!-- %REPLACE% -->', `
					<script src="./${fn}/jquery.js" type="text/javascript"></script>
					<script src="./${fn}/export.js" type="text/javascript"></script>
				`);
			} catch (e) {
				this.log('info', e);
			};
			
			fs.writeFileSync(exportName, content);

			try {
				fs.unlinkSync(path.join(filesPath, 'main.js'));
				fs.unlinkSync(path.join(filesPath, 'run.js'));
			} catch (e) {
				this.log('info', e);
			};

			shell.openPath(exportPath).catch(err => { 
				this.log('info', err);
			});

			this.send(win, 'command', 'saveAsHTMLSuccess');
		}).catch(err => { 
			this.send(win, 'command', 'saveAsHTMLSuccess');
			this.log('info', err); 
		});
	};

};

module.exports = new Util();