const { app, shell, nativeTheme } = require('electron');
const { is } = require('electron-util');
const log = require('electron-log');
const path = require('path');
const fs = require('fs');
const sanitize = require('sanitize-filename');
const protocol = 'anytype';
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
		const theme = ConfigManager.config.theme;

		switch (theme) {
			default:
				return theme;

			case 'system':
				return this.isDarkTheme() ? 'dark' : '';
		};
	};

	getBgColor (theme) {
		const bg = {
			'': '#fff',
			dark: '#060606',
		};
		return bg[theme];
	};

	electronPath () {
		return path.join(this.appPath, 'electron');
	};

	imagePath () {
		return path.join(this.electronPath(), 'img');
	};

	userPath () {
		return app.getPath('userData');
	};

	logPath () {
		const dir = path.join(this.userPath(), 'logs');
		this.createPath(dir);
		return dir;
	};

	createPath (dir) {
		try { fs.mkdirSync(dir); } catch (e) {};
	};

	dataPath () {
		const { channel } = ConfigManager.config;
		const envPath = process.env.DATA_PATH;
		const dataPath = [];

		if (envPath) {
			this.mkDir(envPath);
			dataPath.push(envPath);
		} else {
			dataPath.push(this.userPath());
			if (!is.development && [ 'alpha', 'beta' ].includes(channel)) {
				dataPath.push(channel);
			};
			dataPath.push('data');
		};

		return path.join.apply(null, dataPath);
	};

	send () {
		const args = [ ...arguments ];
		const win = args[0];

		if (win && !win.isDestroyed() && win.webContents) {
			args.shift();
			win.webContents.send.apply(win.webContents, args);
		};
	};

	printHtml (win, exportPath, name, options) {
		const fn = `${name.replace(/\.html$/, '')}_files`;
		const filesPath = path.join(exportPath, fn);
		const exportName = path.join(exportPath, this.fileName(name));

		try { fs.mkdirSync(filesPath); } catch (e) {};

		win.webContents.savePage(exportName, 'HTMLComplete').then(() => {
			let content = fs.readFileSync(exportName, 'utf8');

			// Replace files loaded by url and copy them in page folder
			try {
				content = content.replace(/'(file:\/\/[^']+)'/g, function (s, p, o) {
					const a = p.split('app.asar/dist/');

					let name = a[1].split('/');
					name = name[name.length - 1];

					const src = p.replace('file://', '').replace(/\?.*/, '').replace(/\/app.asar\//g, '/app.asar.unpacked/');
					const dst = path.join(filesPath, name).replace(/\?.*/, '');

					fs.copyFileSync(src, dst);
					return `'./${fn}/${name}'`;
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
				const replaceMeta = `
					<meta name='viewport' content='width=device-width, initial-scale=1.0' />
				`;

				js.forEach(it => {
					fs.copyFileSync(`${ap}/dist/js/${it}.js`, path.join(filesPath, it + '.js'));
					replaceJs += `<script src='./${fn}/${it}.js' type='text/javascript'></script>`;
				});

				css.forEach(it => {
					fs.copyFileSync(`${ap}/dist/css/${it}.css`, path.join(filesPath, it + '.css'));
					replaceCss += `<link rel='stylesheet' href='./${fn}/${it}.css' type='text/css' />`;
				});

				content = content.replace('<!-- %REPLACE-JS% -->', replaceJs);
				content = content.replace('</head>', replaceCss + '</head>');
				content = content.replace('<head>', '<head>' + replaceMeta);
			} catch (e) {
				this.log('info', e);
			};
			
			fs.writeFileSync(exportName, content);

			try {
				fs.unlinkSync(path.join(filesPath, 'js/main.js'));
				fs.unlinkSync(path.join(filesPath, 'js/run.js'));
			} catch (e) {
				this.log('info', e);
			};

			shell.openPath(exportPath).catch(err => { 
				this.log('info', err);
			});

			this.send(win, 'commandGlobal', 'saveAsHTMLSuccess');
		}).catch(err => { 
			this.send(win, 'commandGlobal', 'saveAsHTMLSuccess');
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

				this.send(win, 'commandGlobal', 'saveAsHTMLSuccess');
			});
		}).catch(err => {
			this.send(win, 'commandGlobal', 'saveAsHTMLSuccess');
			this.log('info', err);
		});
	};

	fileName (name) {
		return sanitize(String(name || 'untitled').trim());
	};

	getLang () {
		return ConfigManager.config.interfaceLang || 'en-US';
	};

	enabledLangs () {
		return [
			"cs-CZ", "da-DK", "de-DE", 
			"en-US", "es-ES", "fr-FR", 
			"hi-IN", "id-ID", "it-IT", 
			"lt-LT", "ja-JP", "ko-KR", 
			"nl-NL", "no-NO", "pl-PL", 
			"pt-BR", "ro-RO", "ru-RU", 
			"tr-TR", "uk-UA", "vi-VN", 
			"zh-CN", "zh-TW" 
		];
	};

	translate (key) {
		const lang = this.getLang();
		const defaultData = require(`../../dist/lib/json/lang/en-US.json`);

		let data = {};
		try { data = require(`../../dist/lib/json/lang/${lang}.json`); } catch(e) {};

		return data[key] || defaultData[key] || `⚠️${key}⚠️`;
	};

	defaultUserDataPath () {
		return path.join(app.getPath('appData'), app.getName());
	};

};

module.exports = new Util();
