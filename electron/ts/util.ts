import { app, shell, nativeTheme, BrowserWindow } from 'electron';
import { is } from 'electron-util';
import logger from 'electron-log';
import path from 'path';
import fs from 'fs';
import sanitize from 'sanitize-filename';
import ConfigManager from './config';
import Constant from '../json/constant.json';
import { AppWindow, TabView } from './types';

const protocol = 'anytype';

logger.initialize();
logger.transports.console.level = 'error';
logger.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs', 'log.log');

class Util {

	appPath: string = '';

	setAppPath (value: string): void {
		this.appPath = value;
	};

	mkDir (value: string): void {
		if (value) {
			try { fs.mkdirSync(value); } catch (e) {};
		};
	};

	getLogger (): any {
		return logger;
	};

	getPort (): string {
		return process.env.SERVER_PORT || '8080';
	};

	log (method: string, ...args: any[]): void {
		if (!logger[method]) {
			method = 'info';
		};

		logger[method](...args);
		console.log(...args);
	};

	dateForFile(): string {
		return new Date().toISOString().replace(/:/g, '_').replace(/\..+/, '');
	};

	// MacOs 12.2 (M1): always returns false regardless current color theme
	isDarkTheme (): boolean {
		return nativeTheme.shouldUseDarkColors || nativeTheme.shouldUseHighContrastColors || nativeTheme.shouldUseInvertedColorScheme;
	};

	getRouteFromUrl (url: string): string {
		return String(url || '').replace(`${protocol}://`, '/');
	};

	getTheme (): string {
		const theme = ConfigManager.config.theme;

		switch (theme) {
			default:
				return theme;

			case 'system':
				return this.isDarkTheme() ? 'dark' : '';
		};
	};

	getBgColor (theme: string): string {
		theme = String(theme || '');

		const bg = {
			'': '#fff',
			dark: '#171717',
		};
		return bg[theme];
	};

	electronPath (): string {
		return path.join(this.appPath, 'electron');
	};

	imagePath (): string {
		return path.join(this.electronPath(), 'img');
	};

	userPath (): string {
		return app.getPath('userData');
	};

	logPath (): string {
		const dir = path.join(this.userPath(), 'logs');
		this.createPath(dir);
		return dir;
	};

	createPath (dir: string): void {
		try { fs.mkdirSync(dir); } catch (e) {};
	};

	dataPath (): string {
		const { channel } = ConfigManager.config;
		const envPath = process.env.DATA_PATH;
		const dataPath: string[] = [];

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

	send (win: AppWindow, ...args: [string, ...any[]]): void {
		if (!win || win.isDestroyed() || !win.webContents) {
			return;
		};

		win.webContents.send(...args);
		this.sendToActiveTab(win, ...args);
	};

	sendToTab (win: AppWindow, tabId: string, ...args: [string, ...any[]]): void {
		if (!win || win.isDestroyed() || !win.views) {
			return;
		};

		const view = win.views.find((v: TabView) => v.id == tabId);
		if (view && view.webContents) {
			view.webContents.send(...args);
		};
	};

	getView (win: AppWindow, id: string): TabView | undefined {
		return win?.views?.find((v: TabView) => v.id == id);
	};

	getActiveView (win: AppWindow): TabView | undefined {
		return this.getView(win, win?.activeTabId);
	};

	setNativeThemeSource (): void {
		const { theme } = ConfigManager.config;

		switch (theme) {
			case 'system':
			case 'dark': {
				nativeTheme.themeSource = theme;
				break;
			};

			default: {
				nativeTheme.themeSource = 'light';
				break;
			};
		};
	};

	sendToActiveTab (win: AppWindow, ...args: [string, ...any[]]): void {
		const view = this.getActiveView(win);
		if (view && view.webContents) {
			view.webContents.send(...args);
		};
	};

	sendToAllTabs (win: AppWindow, ...args: [string, ...any[]]): void {
		if (!win || win.isDestroyed() || !win.views) {
			return;
		};

		for (const view of win.views) {
			if (view && view.webContents) {
				view.webContents.send(...args);
			};
		};
	};

	printHtml (win: AppWindow, exportPath: string, name: string, options: Record<string, any>): void {
		const fn = `${name.replace(/\.html$/, '')}_files`;
		const filesPath = path.join(exportPath, fn);
		const exportName = path.join(exportPath, this.fileName(name));
		const view = this.getActiveView(win);
		const webContents = view?.webContents || win.webContents;

		try { fs.mkdirSync(filesPath); } catch (e) {};

		webContents.savePage(exportName, 'HTMLComplete').then(() => {
			let content = fs.readFileSync(exportName, 'utf8');

			// Replace files loaded by url and copy them in page folder
			try {
				content = content.replace(/'(file:\/\/[^']+)'/g, function (s: string, p: string, o: number) {
					const a = p.split('app.asar/dist/');

					let name: any = a[1].split('/');
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

	printPdf (win: AppWindow, exportPath: string, name: string, options: Electron.PrintToPDFOptions): void {
		const view = this.getActiveView(win);
		const webContents = view?.webContents || win.webContents;

		webContents.printToPDF(options).then((data: Buffer) => {
			fs.writeFile(path.join(exportPath, this.fileName(name)), data, (error) => {
				if (!error) {
					shell.openPath(exportPath).catch(err => this.log('info', err));
				} else {
					this.log('info', error);
				};

				this.send(win, 'commandGlobal', 'saveAsHTMLSuccess');
			});
		}).catch(err => {
			this.send(win, 'commandGlobal', 'saveAsHTMLSuccess');
			this.log('info', err);
		});
	};

	fileName (name: string): string {
		return sanitize(String(name || 'untitled').trim());
	};

	getLang (): string {
		return ConfigManager.config.interfaceLang || 'en-US';
	};

	enabledLangs (): string[] {
		return (Constant as any).enabledLangs || [];
	};

	translate (key: string): string {
		const lang = this.getLang();
		const langDir = path.join(__dirname, 'dist', 'lib', 'json', 'lang');
		const defaultData = JSON.parse(fs.readFileSync(path.join(langDir, 'en-US.json'), 'utf8'));

		let data: Record<string, string> = {};
		try { data = JSON.parse(fs.readFileSync(path.join(langDir, `${lang}.json`), 'utf8')); } catch(e) {};

		return data[key] || defaultData[key] || `\u26a0\ufe0f${key}\u26a0\ufe0f`;
	};

	defaultUserDataPath (): string {
		return path.join(app.getPath('appData'), app.getName());
	};

	registerLinuxProtocolHandler (): void {
		if (!is.linux) {
			return;
		};

		const { execFile } = require('child_process');
		const home = process.env.HOME || '';
		const dataHome = process.env.XDG_DATA_HOME || path.join(home, '.local', 'share');
		const applicationsDir = path.join(dataHome, 'applications');
		const desktopFilePath = path.join(applicationsDir, 'anytype.desktop');
		const execPath = process.env.APPIMAGE || process.execPath;

		const content = [
			'[Desktop Entry]',
			'Name=Anytype',
			'Comment=Project management and knowledge workspace',
			`Exec="${execPath}" --ozone-platform-hint=auto %u`,
			'Terminal=false',
			'Type=Application',
			'Icon=anytype',
			'Categories=Utility;Office;Calendar;ProjectManagement;',
			'StartupWMClass=anytype',
			'Keywords=project management;',
			'MimeType=x-scheme-handler/anytype;',
		].join('\n');

		const xwaylandContent = [
			'[Desktop Entry]',
			'Name=Anytype (XWayland)',
			'Comment=Project management and knowledge workspace (XWayland mode)',
			`Exec="${execPath}" --ozone-platform=x11 %u`,
			'Terminal=false',
			'Type=Application',
			'Icon=anytype',
			'Categories=Utility;Office;Calendar;ProjectManagement;',
			'StartupWMClass=anytype',
			'Keywords=project management;',
			'MimeType=x-scheme-handler/anytype;',
			'NoDisplay=true',
		].join('\n');

		const xwaylandFilePath = path.join(applicationsDir, 'anytype-xwayland.desktop');

		try {
			fs.mkdirSync(applicationsDir, { recursive: true });

			if (!fs.existsSync(desktopFilePath)) {
				fs.writeFileSync(desktopFilePath, content, 'utf-8');

				execFile('xdg-mime', [ 'default', 'anytype.desktop', 'x-scheme-handler/anytype' ], (err: any) => {
					if (err) {
						this.log('info', `xdg-mime default failed: ${err.message}`);
					};
				});
			};

			if (!fs.existsSync(xwaylandFilePath)) {
				fs.writeFileSync(xwaylandFilePath, xwaylandContent, 'utf-8');
			};
		} catch (e: any) {
			this.log('info', `registerLinuxProtocolHandler failed: ${e.message}`);
		};
	};

	isWayland (): boolean {
		return is.linux && (process.env.XDG_SESSION_TYPE === 'wayland');
	};

	isKDE (): boolean {
		const desktop = (process.env.XDG_CURRENT_DESKTOP || '').toLowerCase();
		return desktop.split(':').includes('kde');
	};

	getCss (): string {
		const cssPath = path.join(this.userPath(), 'custom.css');
		const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';

		return String(css || '');
	};

};

export default new Util();
