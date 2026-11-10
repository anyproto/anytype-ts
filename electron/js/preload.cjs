const { ipcRenderer, contextBridge, webUtils } = require('electron');
const { app, getCurrentWindow, getGlobal, dialog } = require('@electron/remote');
const fs = require('fs');
const os = require('os');
const path = require('path');
const mime = require('mime-types');
const { execFile, execFileSync } = require('child_process');
const Probe = require('./storageProbe.cjs');
const tmpPath = () => app.getPath('temp');
const commonPath = () => {
	const dir = path.join(app.getPath('userData'), 'common');
	try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {};
	return dir;
};

// --- Vault data location safety check ---
// Classification itself is in storageProbe.cjs; this file supplies the reads. The check the user acts on
// (warning, settings, onboarding) reads synchronously; the diagnostics read asynchronously (storageInfo).

// Windows drive letters: type, filesystem and bus via one PowerShell run per letter, cached in this renderer.
// Never awaited by the synchronous checks — they read whatever has landed.
const winDrives = Probe.createDriveCache();
const winSystemLetter = () => Probe.winDriveLetter(process.env.SystemDrive || 'C:');

// Synchronous reads for the user-facing check, called lazily by the classifier.
const syncReaders = {
	dropboxFolders: () => {
		const files = Probe.dropboxInfoFiles(process.platform, process.env, os.homedir());

		return files.flatMap(f => {
			try {
				return Probe.parseDropboxInfo(fs.readFileSync(f, 'utf8'));
			} catch (e) {
				return [];
			};
		});
	},
	linuxMounts: () => Probe.parseLinuxMounts(fs.readFileSync('/proc/self/mounts', 'utf8')),
	macMounts: () => Probe.parseMacMounts(execFileSync('/sbin/mount', { encoding: 'utf8', timeout: 2000 })),
	statfsType: (p) => (typeof fs.statfsSync == 'function') ? (Number(fs.statfsSync(p).type) >>> 0) : null,
};

// Classifies a path as a cloud-synced or network location.
// Returns { unsafe, kind: ''|'cloud'|'network', provider, path, resolved: whether realpath succeeded }.
const vaultPathClassify = (input) => {
	let p = String(input || app.getPath('userData'));
	let resolved = false;
	try { p = fs.realpathSync.native(p); resolved = true; } catch (e) {};   // resolve symlinks — users symlink userData into synced folders

	return Probe.classifyVaultPath(p, {
		...syncReaders,
		platform: process.platform,
		env: process.env,
		home: os.homedir(),
		resolved,
		drives: winDrives,
		systemLetter: winSystemLetter(),
	});
};

// Cached — the classifier can shell out to /sbin/mount on macOS and callers run in React render paths.
const vaultPathCache = new Map();
const VAULT_PATH_CACHE_TTL = 30000;

const vaultPathInfo = (input) => {
	const key = String(input || '');
	const cached = vaultPathCache.get(key);

	if (cached && ((Date.now() - cached.time) < VAULT_PATH_CACHE_TTL)) {
		return cached.result;
	};

	const result = vaultPathClassify(input);

	// Provisional while the drive letter is still being looked up (it may be a mapped network drive):
	// leave it uncached so the next call sees the real answer
	if ((process.platform == 'win32') && Probe.winClassifyPending(result, winDrives, winSystemLetter())) {
		return result;
	};

	// Bound the cache — the path argument comes from the renderer
	if (vaultPathCache.size >= 50) {
		vaultPathCache.delete(vaultPathCache.keys().next().value);
	};

	vaultPathCache.set(key, { time: Date.now(), result });
	return result;
};

// vaultPathInfo once it is final: waits for a pending Windows drive lookup (bounded by its timeout), so a
// mapped network drive letter is reported as such. Resolves at once everywhere else. Never rejects.
const vaultPathReady = (input) => {
	try {
		const result = vaultPathInfo(input);
		const letter = (process.platform == 'win32') ? Probe.winClassifyPending(result, winDrives, winSystemLetter()) : '';

		if (!letter) {
			return Promise.resolve(result);
		};
		return winDrives.get(letter).then(() => vaultPathInfo(input), () => result);
	} catch (e) {
		return Promise.resolve(null);
	};
};

// --- Storage flags for diagnostics ---

let defaultUserDataPath = '';

// Where to find the data for path p, as flags only — the path itself is never part of the result:
// { kind: 'local'|'cloud'|'network'|'unknown', provider, driveType: 'fixed'|'removable'|'remote'|'other'|'unknown',
//   fsType, busType, onSystemDrive: bool|null, isDefaultWorkdir }.
// Asynchronous I/O only, every call bounded (storageProbe.cjs), so it never blocks this thread. Never rejects.
const storageInfoLookup = Probe.createStorageInfo({
	fs,
	execFile,
	platform: process.platform,
	env: process.env,
	home: os.homedir(),
	drives: winDrives,
	systemLetter: winSystemLetter(),
	defaultUserData: () => defaultUserDataPath || (defaultUserDataPath = path.join(app.getPath('appData'), app.getName())),
});

const storageInfo = (input) => {
	try {
		return storageInfoLookup(String(input || app.getPath('userData')));
	} catch (e) {
		return Promise.resolve(null);
	};
};

contextBridge.exposeInMainWorld('Electron', {
	version: {
		app: app.getVersion(),
		os: [ os.platform(), process.arch, process.getSystemVersion() ].join(' '),
		system: process.getSystemVersion(),
		device: os.hostname(),
	},
	platform: os.platform(),
	arch: process.arch,

	storeGet: key => ipcRenderer.sendSync('storeGet', key),
	storeSet: (key, value) => ipcRenderer.sendSync('storeSet', key, value),
	storeDelete: key => ipcRenderer.sendSync('storeDelete', key),

	isPackaged: app.isPackaged,
	// Origin embeds are served from, kept apart from the app (electron/ts/lib/embedProtocol.ts)
	embedOrigin: 'anytype-embed://app',
	userPath: () => app.getPath('userData'),
	tmpPath,
	commonPath,
	downloadPath: () => app.getPath('downloads'),
	logPath: () => path.join(app.getPath('userData'), 'logs'),
	dirName: fp => path.dirname(fp),
	filePath: (...args) => path.join(...args),
	fileName: fp => path.basename(fp),
	fileMime: fp => mime.lookup(fp),
	fileExt: fp => path.extname(fp).replace(/^./, ''),
	fileSize: fp => fs.statSync(fp).size,
	isDirectory: fp => {
		let ret = false;
		try { ret = fs.lstatSync(fp).isDirectory(); } catch (e) {};
		return ret;
	},
	defaultPath: () => path.join(app.getPath('appData'), app.getName()),
	checkVaultPath: p => vaultPathInfo(p),
	checkVaultPathReady: p => vaultPathReady(p),
	storageInfo: p => storageInfo(p),
	getTheme: () => ipcRenderer.sendSync('getTheme'),
	getBgColor: () => ipcRenderer.sendSync('getBgColor'),
	getConfig: () => ipcRenderer.sendSync('getConfig'),
	tabId: () => {
		const arg = process.argv.find(arg => arg.startsWith('--tab-id='));
		return arg ? arg.split('=')[1] : null;
	},
	winId: () => {
		const arg = process.argv.find(arg => arg.startsWith('--win-id='));
		return arg ? Number(arg.split('=')[1]) : null;
	},

	currentWindow: () => getCurrentWindow(),
	isFocused: () => getCurrentWindow().isFocused(),
	isFullScreen: () => getCurrentWindow().isFullScreen(),
	focus: () => {
		getCurrentWindow().focus();
		app.focus({ steal: true });
	},
	getGlobal: key => getGlobal(key),
	showOpenDialog: dialog.showOpenDialog,

	webFilePath: file => webUtils && webUtils.getPathForFile(file),

	logRead: fp => {
		const base = commonPath();
		const resolved = path.resolve(fp);
		const rel = path.relative(base, resolved);
		if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
			throw new Error('logRead: path is outside of the common folder');
		};
		return new Uint8Array(fs.readFileSync(resolved));
	},

	fileWrite: (name, data, options) => {
		name = String(name || 'temp');
		options = options || {};

		// A fresh folder per file keeps the original name while files with the same name never overwrite each other
		const dir = options.unique ? fs.mkdtempSync(path.join(tmpPath(), 'anytype-')) : tmpPath();
		// Windows drops trailing dots and spaces when the path is opened, and '.' or '..' would resolve to a folder
		const fn = path.parse(name).base.replace(/[. ]+$/, '') || 'temp';
		const fp = path.join(dir, fn);

		delete options.unique;
		options.mode = 0o666;

		fs.writeFileSync(fp, data, options);
		return fp;
	},

	on: (event, callBack) => ipcRenderer.on(event, callBack),
	removeAllListeners: (event) => ipcRenderer.removeAllListeners(event),
	send: (event, ...args) => ipcRenderer.send(event, ...args),

	Api: (id, cmd, args) => {
		id = Number(id) || 0;
		cmd = String(cmd || '');
		args = args || [];

		let ret = new Promise(() => {});

		try { 
			ret = ipcRenderer.invoke('Api', id, cmd, args).catch((error) => {
				console.log(error);
			}); 
		} catch (e) {};

		return ret;
	},
});
