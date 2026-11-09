const { ipcRenderer, contextBridge, webUtils } = require('electron');
const { app, getCurrentWindow, getGlobal, dialog } = require('@electron/remote');
const fs = require('fs');
const os = require('os');
const path = require('path');
const mime = require('mime-types');
const { execFileSync } = require('child_process');
const Probe = require('./storageProbe.cjs');
const tmpPath = () => app.getPath('temp');
const commonPath = () => {
	const dir = path.join(app.getPath('userData'), 'common');
	try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {};
	return dir;
};

// --- Vault data location safety check ---

// Segment-level markers (tested against each path segment to avoid "Sandbox" → "box" false positives).
const CLOUD_MARKERS = [
	[ /dropbox/i, 'Dropbox' ],
	[ /onedrive/i, 'OneDrive' ],
	[ /^google\s?drive/i, 'Google Drive' ],
	[ /googledrive/i, 'Google Drive' ],       // macOS File Provider: "GoogleDrive-<email>"
	[ /icloud/i, 'iCloud Drive' ],
	[ /nextcloud/i, 'Nextcloud' ],
	[ /owncloud/i, 'ownCloud' ],
	[ /^box( sync)?$/i, 'Box' ],
	[ /pcloud/i, 'pCloud' ],
	[ /^mega(sync)?$/i, 'MEGA' ],
	[ /yandex\.?disk/i, 'Yandex.Disk' ],
	[ /baidu(net|sync)disk/i, 'Baidu' ],
	[ /syncthing/i, 'Syncthing' ],
	[ /creative cloud files/i, 'Creative Cloud' ],
];

// Linux statfs f_type magic numbers for remote filesystems.
// No FUSE magic here: FUSE also backs local filesystems (ntfs-3g, gocryptfs, exfat-fuse) —
// remote FUSE backends (sshfs, rclone) are resolved by fstype via /proc/self/mounts instead.
const NET_MAGIC = {
	0x6969:     'NFS',
	0x517b:     'SMB',
	0xfe534d42: 'SMB',   // SMB2
	0xff534d42: 'SMB',   // CIFS
	0x564c:     'NetWare',
	0xaad7aaea: 'PanFS',
	0x01021997: 'V9FS',
	0x73757245: 'Coda',
};

// Linux fstype names (3rd field of /proc/self/mounts) that mean a remote filesystem.
const LINUX_REMOTE_FSTYPES = {
	nfs:            'NFS',
	nfs4:           'NFS',
	cifs:           'SMB',
	smb3:           'SMB',
	smbfs:          'SMB',
	davfs:          'WebDAV',
	'fuse.davfs2':  'WebDAV',
	'fuse.sshfs':   'SSHFS',
	'fuse.rclone':  'rclone',
	'fuse.gcsfuse': 'gcsfuse',
	'fuse.s3fs':    's3fs',
	'9p':           '9P',
	ceph:           'Ceph',
	glusterfs:      'GlusterFS',
	afs:            'AFS',
};

const providerFromSegment = (seg) => {
	seg = String(seg || '');
	for (const [ re, name ] of CLOUD_MARKERS) {
		if (re.test(seg)) {
			return name;
		};
	};
	return seg.split('-')[0] || '';   // File Provider folders are "<Provider>-<account>"
};

const providerFromPath = (p) => {
	const segs = String(p).split(/[\/\\]+/).filter(Boolean);
	for (const seg of segs) {
		for (const [ re, name ] of CLOUD_MARKERS) {
			if (re.test(seg)) {
				return name;
			};
		};
	};
	return '';
};

// Read Dropbox info.json to get the real folder path(s), regardless of folder name.
const dropboxFolders = () => {
	const out = [];
	const files = [];

	if (process.platform == 'win32') {
		[ process.env.APPDATA, process.env.LOCALAPPDATA ].forEach(d => d && files.push(path.join(d, 'Dropbox', 'info.json')));
	} else {
		files.push(path.join(os.homedir(), '.dropbox', 'info.json'));
	};

	for (const f of files) {
		try {
			const data = JSON.parse(fs.readFileSync(f, 'utf8'));
			Object.keys(data).forEach(k => {
				if (data[k] && data[k].path) {
					out.push(data[k].path);
				};
			});
		} catch (e) {};
	};
	return out;
};

// macOS mount names that mean a remote filesystem.
const MAC_REMOTE_FSTYPES = { smbfs: 'SMB', nfs: 'NFS', webdav: 'WebDAV', afpfs: 'AFP', ftp: 'FTP' };

// Mount tables: [{ mnt, type }], or null when unreadable. macOS shells out: macMounts(true) reads afresh
// (vault location checks, so a share mounted a moment ago counts), macMounts(false) may reuse a read from
// the last 30s (diagnostics).
const macMounts = Probe.cachedReader(() => Probe.parseMacMounts(execFileSync('/sbin/mount', { encoding: 'utf8', timeout: 2000 })), { ttl: 30000 });

const linuxMounts = () => {
	try {
		return Probe.parseLinuxMounts(fs.readFileSync('/proc/self/mounts', 'utf8'));
	} catch (e) {
		return null;
	};
};

// Mount table for the diagnostics, or null where there is none to read.
const mountTable = () => {
	if (process.platform == 'darwin') {
		return macMounts(false);
	};
	if (process.platform == 'linux') {
		return linuxMounts();
	};
	return null;
};

// Windows drive letters: type, filesystem and bus via one PowerShell run per letter, cached in this renderer.
// Never awaited by the synchronous checks — they read whatever has landed.
const winDrives = Probe.createDriveCache();
const winSystemLetter = () => Probe.winDriveLetter(process.env.SystemDrive || 'C:');

// Linux: resolve the fstype of the mount containing p via /proc/self/mounts.
// Returns a remote-FS name, '' when the mount is a known local type, or null when undetermined.
const linuxMountType = (p) => {
	const mount = Probe.findMount(p, linuxMounts(), true);
	if (!mount || !mount.type) {
		return null;
	};
	return LINUX_REMOTE_FSTYPES[mount.type] || '';
};

const networkType = (p) => {
	// Windows: UNC path (\\server\share), or a drive letter already known to be a mapped network drive.
	// An unknown letter starts its lookup here; vaultPathInfo does not cache the provisional answer.
	if (process.platform == 'win32') {
		const t = Probe.winNetworkType(p, winDrives, winSystemLetter());
		if (t) {
			return t;
		};
	};

	// Linux: fstype from the mount table is authoritative (distinguishes remote FUSE from local FUSE).
	if (process.platform == 'linux') {
		const t = linuxMountType(p);
		if (null !== t) {
			return t;
		};
	};

	// Fallback: statfs f_type magic.
	try {
		if (typeof fs.statfsSync == 'function') {
			const st = fs.statfsSync(p);
			const t = Number(st.type) >>> 0;
			if (NET_MAGIC[t]) {
				return NET_MAGIC[t];
			};
		};
	} catch (e) {};

	// macOS: statfs.type is not a usable name — parse the mount table instead.
	if (process.platform == 'darwin') {
		const mount = Probe.findMount(p, macMounts(true), false);
		if (mount && MAC_REMOTE_FSTYPES[mount.type]) {
			return MAC_REMOTE_FSTYPES[mount.type];
		};
	};

	return '';
};

// Classifies a path as a cloud-synced or network location.
// Returns { unsafe, kind: ''|'cloud'|'network', provider, path, resolved: whether realpath succeeded }.
const vaultPathClassify = (input) => {
	let p = String(input || app.getPath('userData'));
	let resolved = false;
	try { p = fs.realpathSync.native(p); resolved = true; } catch (e) {};   // resolve symlinks — users symlink userData into synced folders

	// Windows realpath can return long-path form: "\\?\C:\..." or "\\?\UNC\server\share".
	// Normalize it or every Windows path would match the UNC test below.
	p = p.replace(/^\\\\\?\\UNC\\/i, '\\\\').replace(/^\\\\\?\\/, '');

	const result = { unsafe: false, kind: '', provider: '', path: p, resolved };
	const home = os.homedir();
	const sep = path.sep;
	const lc = p.toLowerCase();
	const startsWith = (base) => !!base && lc.startsWith(String(base).toLowerCase().replace(/[\/\\]+$/, '') + sep);

	// Cloud: canonical macOS File Provider roots
	const cloudStorage = path.join(home, 'Library', 'CloudStorage');    // Dropbox, GoogleDrive-*, OneDrive-*, Box
	const mobileDocs = path.join(home, 'Library', 'Mobile Documents');  // iCloud Drive

	if (startsWith(cloudStorage)) {
		const seg = (p.slice(cloudStorage.length + 1).split(sep)[0]) || '';
		return { ...result, unsafe: true, kind: 'cloud', provider: providerFromSegment(seg) || 'Cloud storage' };
	};
	if (startsWith(mobileDocs)) {
		return { ...result, unsafe: true, kind: 'cloud', provider: 'iCloud Drive' };
	};

	// Cloud: OneDrive env vars (Windows)
	for (const v of [ 'OneDrive', 'OneDriveConsumer', 'OneDriveCommercial' ]) {
		if (startsWith(process.env[v])) {
			return { ...result, unsafe: true, kind: 'cloud', provider: 'OneDrive' };
		};
	};

	// Cloud: Dropbox info.json real path(s)
	for (const dp of dropboxFolders()) {
		if (startsWith(dp) || (lc == String(dp).toLowerCase())) {
			return { ...result, unsafe: true, kind: 'cloud', provider: 'Dropbox' };
		};
	};

	// Cloud: per-segment name markers (low-confidence fallback — warn, not block, so false positives are tolerable)
	const provider = providerFromPath(p);
	if (provider) {
		return { ...result, unsafe: true, kind: 'cloud', provider };
	};

	// Network / remote filesystem
	const net = networkType(p);
	if (net) {
		return { ...result, unsafe: true, kind: 'network', provider: net };
	};

	return result;
};

// Cached — networkType() can shell out to /sbin/mount on macOS and callers run in React render paths.
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

// Every provider name the classifiers above can produce; anything else is reported as 'Other'
const KNOWN_PROVIDERS = new Set([
	...CLOUD_MARKERS.map(it => it[1]),
	...Object.values(NET_MAGIC),
	...Object.values(LINUX_REMOTE_FSTYPES),
	...Object.values(MAC_REMOTE_FSTYPES),
	Probe.NETWORK_DRIVE,
	'Cloud storage',
]);

// Where the data for path p physically lives, as flags only — the path itself is never part of the result:
// { kind: 'local'|'cloud'|'network'|'unknown', provider, driveType: 'fixed'|'removable'|'remote'|'other'|'unknown',
//   fsType, busType, onSystemDrive: bool|null, isDefaultWorkdir }.
// Async because Windows needs a PowerShell run (cached per letter, bounded by its timeout). Never rejects.
const storageInfo = (input) => {
	const platform = process.platform;

	let raw = '';
	let check = null;
	let isDefaultWorkdir = false;

	const build = (param) => Probe.buildStorageInfo({ check, knownProviders: KNOWN_PROVIDERS, isDefaultWorkdir, ...param });

	try {
		raw = String(input || app.getPath('userData'));
		check = vaultPathInfo(raw);

		// Default workdir = the data was never moved (Settings, userDataPath, DATA_PATH). Compared unresolved:
		// a symlinked default location still counts as default, its target shows up in the other flags
		isDefaultWorkdir = Probe.isDefaultDataPath(raw, path.join(app.getPath('appData'), app.getName()), platform);

		const p = check.path;

		// Unresolvable (dead link, missing folder): nothing to probe, everything reads unknown
		if (check.resolved === false) {
			return Promise.resolve(build({}));
		};

		if (platform == 'win32') {
			const letter = Probe.winDriveLetter(p);

			if (!letter) {
				const isUnc = Probe.isUncPath(p);
				return Promise.resolve(build({ drive: isUnc ? Probe.REMOTE_DRIVE : null, onSystemDrive: isUnc ? false : null }));
			};

			const onSystemDrive = letter == winSystemLetter();

			return winDrives.get(letter).then(
				drive => build({ drive, onSystemDrive }),
				() => build({ onSystemDrive }),
			);
		};

		const table = mountTable();
		const mount = Probe.findMount(p, table, platform == 'linux');

		return Promise.resolve(build({ mount, onSystemDrive: Probe.isSystemVolume(mount, platform, table) }));
	} catch (e) {
		try {
			return Promise.resolve(build({}));
		} catch (e2) {
			return Promise.resolve(null);
		};
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
