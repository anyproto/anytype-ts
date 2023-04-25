const { app, shell, nativeTheme } = require('electron');
const { is } = require('electron-util');
const log = require('electron-log');
const path = require('path');
const fs = require('fs');
const sanitize = require('sanitize-filename');
const protocol = 'anytype';
const userPath = app.getPath('userData');
const ConfigManager = require('./config.js');

log.transports.rendererConsole.level = 'error';

class Util {

	appPath = '';

	setAppPath (value) {
		this.appPath = value;
	};

	mkDir (value) {
		if (value) {
			try { fs.mkdirSync(value); } catch (e) {};
		};
	};

	log (method, text) {
		if (!log[method]) {
			method = 'info';
		};

		log[method](text);
		console.log(text);
	};

	dateForFile() {
		return new Date().toISOString().replace(/:/g, '_').replace(/\..+/, '');
	};

	// MacOs 12.2 (M1): always returns false regardless current color theme
	isDarkTheme () {
		return nativeTheme.shouldUseDarkColors || nativeTheme.shouldUseHighContrastColors || nativeTheme.shouldUseInvertedColorScheme;
	};

	getRouteFromUrl (url) {
		return url.replace(`${protocol}://`, '/');
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

	electronPath () {
		return path.join(this.appPath, 'electron');
	};

	imagePath () {
		return path.join(this.electronPath(), 'img');
	};

	dataPath () {
		const { channel } = ConfigManager.config;
		const dataPath = [];

		if (process.env.DATA_PATH) {
			this.mkDir(process.env.DATA_PATH);
			dataPath.push(process.env.DATA_PATH);
		} else {
			dataPath.push(userPath);

			if (is.development) {
				dataPath.push('dev');
			} else 
			if ([ 'alpha', 'beta' ].includes(channel)) {
				dataPath.push(channel);
			};

			dataPath.push('data');
		};

		return path.join.apply(null, dataPath);
	};

	send () {
		const args = [ ...arguments ];
		const win = args[0];

		if (win && win.webContents) {
			args.shift();
			win.webContents.send.apply(win.webContents, args);
		};
	};

	printHtml (win, exportPath, name, options) {
		const fn = `${name.replace(/\.html$/, '')}_files`;
		const filesPath = path.join(exportPath, fn);
		const exportName = path.join(exportPath, this.fileName(name));

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
				const css = [ 'export' ];
				const js = [ 'export', 'jquery' ];
				const ap = app.getAppPath();

				let replaceJs = '';
				let replaceCss = '';

				js.forEach(it => {
					fs.copyFileSync(`${ap}/dist/js/${it}.js`, path.join(filesPath, it + '.js'));
					replaceJs += `<script src="./${fn}/${it}.js" type="text/javascript"></script>`;
				});

				css.forEach(it => {
					fs.copyFileSync(`${ap}/dist/css/${it}.css`, path.join(filesPath, it + '.css'));
					replaceCss += `<link rel="stylesheet" href="./${fn}/${it}.css" type="text/css" />`;
				});

				content = content.replace('<!-- %REPLACE-JS% -->', replaceJs);
				content = content.replace('</head>', replaceCss + '</head>');
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

	printPdf (win, exportPath, name, options) {
		win.webContents.printToPDF(options).then(data => {
			fs.writeFile(path.join(exportPath, this.fileName(name)), data, (error) => {
				if (error) throw error;

				shell.openPath(exportPath).catch(err => {
					this.log('info', err);
				});

				this.send(win, 'command', 'saveAsHTMLSuccess');
			});
		}).catch(err => {
			this.send(win, 'command', 'saveAsHTMLSuccess');
			this.log('info', err);
		});
	};

	fileName (name) {
		return sanitize(String(name || 'untitled').trim());
	};

};

module.exports = new Util();