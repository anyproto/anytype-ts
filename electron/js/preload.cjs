const { ipcRenderer, contextBridge, webUtils } = require('electron');
const { app, getCurrentWindow, getGlobal, dialog } = require('@electron/remote');
const fs = require('fs');
const os = require('os');
const path = require('path');
const mime = require('mime-types');
const { execFileSync } = require('child_process');
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

// Linux: resolve the fstype of the mount containing p via /proc/self/mounts.
// Returns a remote-FS name, '' when the mount is a known local type, or null when undetermined.
const linuxMountType = (p) => {
	try {
		const lines = fs.readFileSync('/proc/self/mounts', 'utf8').split('\n');
		let best = '';
		let bestType = '';

		for (const line of lines) {
			const parts = line.split(' ');
			if (parts.length < 3) {
				continue;
			};

			const mnt = parts[1].replace(/\\040/g, ' ').replace(/\\011/g, '\t');
			const type = parts[2];
			const pref = mnt.endsWith('/') ? mnt : (mnt + '/');

			if (((p == mnt) || p.startsWith(pref)) && (mnt.length >= best.length)) {
				best = mnt;
				bestType = type;
			};
		};

		if (!bestType) {
			return null;
		};
		return LINUX_REMOTE_FSTYPES[bestType] || '';
	} catch (e) {
		return null;
	};
};

const networkType = (p) => {
	// Windows UNC path (\\server\share). Mapped network drive LETTERS are NOT detected in v1.
	if ((process.platform == 'win32') && /^\\\\/.test(p)) {
		return 'Network drive';
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
		try {
			const out = execFileSync('/sbin/mount', { encoding: 'utf8', timeout: 2000 });
			const NET = { smbfs: 'SMB', nfs: 'NFS', webdav: 'WebDAV', afpfs: 'AFP', ftp: 'FTP' };
			let best = '';
			let bestType = '';

			out.split('\n').forEach(line => {
				// "//u@host/share on /Volumes/x (smbfs, ...)" — greedy so mount points containing " (" parse correctly
				const m = line.match(/ on (.+) \(([^,)]+)/);
				if (!m) {
					return;
				};

				const mnt = m[1];
				const type = m[2];
				const pref = mnt.endsWith('/') ? mnt : (mnt + '/');

				if (((p == mnt) || p.startsWith(pref)) && (mnt.length > best.length)) {
					best = mnt;
					bestType = type;
				};
			});

			if (NET[bestType]) {
				return NET[bestType];
			};
		} catch (e) {};
	};

	return '';
};

// Classifies a path as a cloud-synced or network location.
// Returns { unsafe, kind: ''|'cloud'|'network', provider, path }.
const vaultPathClassify = (input) => {
	let p = String(input || app.getPath('userData'));
	try { p = fs.realpathSync.native(p); } catch (e) {};   // resolve symlinks — users symlink userData into synced folders

	// Windows realpath can return long-path form: "\\?\C:\..." or "\\?\UNC\server\share".
	// Normalize it or every Windows path would match the UNC test below.
	p = p.replace(/^\\\\\?\\UNC\\/i, '\\\\').replace(/^\\\\\?\\/, '');

	const result = { unsafe: false, kind: '', provider: '', path: p };
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

	// Bound the cache — the path argument comes from the renderer
	if (vaultPathCache.size >= 50) {
		vaultPathCache.delete(vaultPathCache.keys().next().value);
	};

	vaultPathCache.set(key, { time: Date.now(), result });
	return result;
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

		const fn = path.parse(name).base;
		const fp = path.join(tmpPath(), fn);

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
