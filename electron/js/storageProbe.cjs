// Where does the vault data physically live: drive type, filesystem, bus. Feeds the storage_* tags on
// middleware diagnostic reports and the Windows half of the vault location warning.
// Pure helpers plus an injectable PowerShell runner: no electron imports, so electron/ts/storageProbe.test.ts
// can load this file. preload.cjs wires it to the real system.

const { execFile } = require('child_process');
const path = require('path');

const UNKNOWN = 'unknown';
const NETWORK_DRIVE = 'Network drive';

// Fixed drive info for a UNC path: no letter to look up, and no local bus behind it
const REMOTE_DRIVE = Object.freeze({ driveType: 'remote', fsType: UNKNOWN, busType: 'network' });

const POWERSHELL_TIMEOUT = 3000;
const DRIVE_CACHE_TTL = 10 * 60 * 1000;
const DRIVE_CACHE_FAIL_TTL = 5 * 60 * 1000;

// System.IO.DriveInfo.DriveType names, and Win32_LogicalDisk.DriveType codes for the CIM fallback
const WIN_DRIVE_TYPES = {
	fixed:     'fixed',
	removable: 'removable',
	network:   'remote',
	cdrom:     'other',
	ram:       'other',
	'2':       'removable',
	'3':       'fixed',
	'4':       'remote',
	'5':       'other',
	'6':       'other',
};

// STORAGE_BUS_TYPE codes, for when Get-Disk hands back the number instead of its name
const WIN_BUS_TYPES = [
	UNKNOWN, 'scsi', 'atapi', 'ata', '1394', 'ssa', 'fibre_channel', 'usb', 'raid', 'iscsi', 'sas', 'sata',
	'sd', 'mmc', 'virtual', 'file_backed_virtual', 'storage_spaces', 'nvme', 'scm', 'ufs',
];

// Lowercase identifier: "File Backed Virtual" -> "file_backed_virtual", "NTFS" -> "ntfs"
const token = (v) => String(v || '').trim().toLowerCase().replace(/[^a-z0-9.]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 32);

// Filesystems that live on a local device: the only ones that make a location 'local'
const LOCAL_FS_TYPES = new Set([
	'apfs', 'hfs', 'ntfs', 'ntfs3', 'refs', 'exfat', 'fat', 'fat16', 'fat32', 'vfat', 'msdos',
	'ext2', 'ext3', 'ext4', 'btrfs', 'xfs', 'zfs', 'f2fs', 'jfs', 'reiserfs', 'bcachefs', 'fuseblk',
	'udf', 'cdfs', 'iso9660', 'tmpfs',
]);

// Network or ambiguous filesystems: reported by name, never taken as proof of 'local'
const OTHER_FS_TYPES = new Set([
	'nfs', 'nfs4', 'smbfs', 'cifs', 'smb3', 'afpfs', 'webdav', 'davfs', 'ftp', '9p', 'ceph', 'glusterfs', 'afs',
	'fuse', 'macfuse', 'osxfuse', 'fuse.sshfs', 'fuse.rclone', 'fuse.davfs2', 'fuse.gcsfuse', 'fuse.s3fs',
	'overlay', 'nullfs', 'ecryptfs', 'squashfs', 'lifs',
]);

const BUS_TYPES = new Set([ ...WIN_BUS_TYPES, 'network', 'other' ]);
const BUS_ALIASES = { spaces: 'storage_spaces', filebackedvirtual: 'file_backed_virtual', fibre: 'fibre_channel' };

// Allowlisted values only: these end up in diagnostics, and a fuse subtype or an odd driver name is free text
const fsTypeOf = (v) => {
	const t = token(v);

	if (!t || (t == UNKNOWN)) {
		return UNKNOWN;
	};
	if (LOCAL_FS_TYPES.has(t) || OTHER_FS_TYPES.has(t)) {
		return t;
	};
	return t.startsWith('fuse.') ? 'fuse' : 'other';
};

const busTypeOf = (v) => {
	const s = String(v || '').trim();

	if (!s) {
		return UNKNOWN;
	};
	if (/^\d+$/.test(s)) {
		return WIN_BUS_TYPES[Number(s)] || 'other';
	};

	const t = token(s);
	const b = BUS_ALIASES[t] || t;

	return BUS_TYPES.has(b) ? b : 'other';
};

const unknownDrive = () => ({ driveType: UNKNOWN, fsType: UNKNOWN, busType: UNKNOWN });

// "C:\..." or "c:/..." -> "C"; anything else (UNC, relative, posix) -> ''
const winDriveLetter = (p) => {
	const m = String(p || '').match(/^([a-z]):(?:[\\/]|$)/i);
	return m ? m[1].toUpperCase() : '';
};

const isUncPath = (p) => /^[\\/]{2}[^\\/]/.test(String(p || ''));

// "c" -> "C"; anything that is not a single letter -> ''
const normLetter = (letter) => /^[a-z]$/i.test(String(letter || '')) ? String(letter).toUpperCase() : '';

// The system drive as "C" or "C:" (the form of %SystemDrive%) -> "C"
const systemLetterOf = (v) => normLetter(v) || winDriveLetter(v);

// One PowerShell run per drive letter. DriveInfo is a plain Win32 call (GetDriveType/GetVolumeInformation),
// with Win32_LogicalDisk only as a fallback for when New-Object is not allowed (constrained language mode).
// Both give enum names or codes, not text in the UI language as fsutil does. The drive line goes out first,
// so a run killed by the timeout in the slower Get-Partition step can still yield drive type and filesystem.
// No double quotes or backslashes in the script: it reaches powershell.exe as one argument, and those are
// the two characters Windows command line quoting rewrites.
const winDriveScript = (letter) => {
	letter = normLetter(letter);
	if (!letter) {
		return '';
	};

	return [
		`$ErrorActionPreference = 'Stop'`,
		`$ProgressPreference = 'SilentlyContinue'`,
		`$l = '${letter}'`,
		`$t = ''`,
		`$f = ''`,
		`try { $d = New-Object System.IO.DriveInfo $l; $t = [string]$d.DriveType; try { $f = [string]$d.DriveFormat } catch {} } catch { try { $c = Get-CimInstance -ClassName Win32_LogicalDisk -Filter ('DeviceID=''' + $l + ':''') -OperationTimeoutSec 2; $t = [string]$c.DriveType; $f = [string]$c.FileSystem } catch {} }`,
		`Write-Output ('D|' + $t + '|' + $f)`,
		`if (($t -ne 'Network') -and ($t -ne '4')) { $b = ''; try { $b = [string](Get-Partition -DriveLetter $l | Get-Disk | Select-Object -First 1).BusType } catch {}; Write-Output ('B|' + $b) }`,
	].join('; ');
};

// Parses winDriveScript output. Missing or garbled lines stay 'unknown', never a guess.
const parseWinDriveOutput = (out) => {
	const ret = unknownDrive();

	String(out || '').split(/\r?\n/).forEach(line => {
		const parts = line.trim().split('|');

		if ((parts[0] == 'D') && (parts.length >= 2)) {
			ret.driveType = WIN_DRIVE_TYPES[token(parts[1])] || UNKNOWN;
			ret.fsType = fsTypeOf(parts[2]);
		};

		if ((parts[0] == 'B') && (parts.length >= 2)) {
			ret.busType = busTypeOf(parts[1]);
		};
	});

	if ((ret.driveType == 'remote') && (ret.busType == UNKNOWN)) {
		ret.busType = 'network';
	};
	return ret;
};

const powershellPath = (env) => {
	const root = String((env || process.env).SystemRoot || 'C:\\Windows').replace(/[\\/]+$/, '');
	return `${root}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`;
};

// Runs a script and resolves with whatever stdout it produced: on success, on error, on timeout (partial
// output), and on a callback that never comes (the guard). Never rejects.
const runPowerShell = (script, param) => {
	param = param || {};

	const run = param.execFile || execFile;
	const timeout = Number(param.timeout) || POWERSHELL_TIMEOUT;

	return new Promise(resolve => {
		let done = false;
		let collected = '';
		let guard = null;

		const finish = (out) => {
			if (done) {
				return;
			};

			done = true;
			clearTimeout(guard);
			resolve(String(out || collected || ''));
		};

		guard = setTimeout(() => finish(collected), timeout + 1000);
		if (guard && guard.unref) {
			guard.unref();
		};

		try {
			const child = run(powershellPath(param.env), [ '-NoLogo', '-NoProfile', '-NonInteractive', '-Command', script ], {
				encoding: 'utf8',
				timeout,
				windowsHide: true,
				maxBuffer: 64 * 1024,
			}, (err, stdout) => finish(stdout));

			if (child && child.stdout && child.stdout.on) {
				child.stdout.on('data', d => { collected += String(d); });
			};
			if (child && child.on) {
				child.on('error', () => finish(collected));
			};
		} catch (e) {
			finish('');
		};
	});
};

// Per-letter cache of drive lookups with in-flight dedupe. get() waits for a lookup, peek() never does: it
// returns what is cached (stale included) and starts a refresh when nothing fresh is there. A failed lookup
// is cached too, for less time, so a blocked PowerShell is not respawned on every render.
const createDriveCache = (param) => {
	param = param || {};

	const lookup = param.lookup || (letter => runPowerShell(winDriveScript(letter)));
	const now = param.now || Date.now;
	const ttl = param.ttl || DRIVE_CACHE_TTL;
	const failTtl = param.failTtl || DRIVE_CACHE_FAIL_TTL;
	const cache = new Map();

	const isFresh = (entry) => {
		if (!entry || !entry.info) {
			return false;
		};
		return (now() - entry.time) < ((entry.info.driveType == UNKNOWN) ? failTtl : ttl);
	};

	const get = (letter) => {
		letter = normLetter(letter);
		if (!letter) {
			return Promise.resolve(unknownDrive());
		};

		const entry = cache.get(letter);
		if (isFresh(entry)) {
			return Promise.resolve(entry.info);
		};
		if (entry && entry.promise) {
			return entry.promise;
		};

		const promise = Promise.resolve()
			.then(() => lookup(letter))
			.then(out => parseWinDriveOutput(out), () => unknownDrive())
			.then(info => {
				cache.set(letter, { time: now(), info, promise: null });
				return info;
			});

		// Keep the stale info readable through peek() while the refresh runs
		cache.set(letter, { ...(entry || {}), promise });
		return promise;
	};

	const peek = (letter) => {
		letter = normLetter(letter);
		if (!letter) {
			return null;
		};

		const entry = cache.get(letter);
		if (!isFresh(entry)) {
			get(letter);
		};
		return (entry && entry.info) ? entry.info : null;
	};

	const known = (letter) => {
		const entry = cache.get(normLetter(letter));
		return !!(entry && entry.info);
	};

	return { get, peek, known };
};

// Windows part of the network check, synchronous: UNC paths, and drive letters the cache already knows
// are network drives. An uncached letter starts a lookup and reads as not-network until it lands.
// The system drive is never looked up here: Windows boots from a local volume, so it is never a mapped
// share, and the default location (C:) costs no PowerShell run.
const winNetworkType = (p, drives, systemLetter) => {
	if (isUncPath(p)) {
		return NETWORK_DRIVE;
	};

	const letter = winDriveLetter(p);
	if (!letter || !drives || (letter == systemLetterOf(systemLetter))) {
		return '';
	};

	const info = drives.peek(letter);
	return (info && (info.driveType == 'remote')) ? NETWORK_DRIVE : '';
};

// The letter whose lookup a classification is waiting for, or '' when it is final: something was found
// already, or the drive type is known (or never needed, the system drive). A pending result may still turn
// into 'network' and must not be cached.
const winClassifyPending = (check, drives, systemLetter) => {
	if (!check || check.kind || !drives) {
		return '';
	};

	const letter = winDriveLetter(check.path);
	if (!letter || (letter == systemLetterOf(systemLetter)) || drives.known(letter)) {
		return '';
	};
	return letter;
};

// macOS `mount` output: "/dev/disk3s5 on /System/Volumes/Data (apfs, local, journaled)".
// Greedy so mount points containing " (" parse correctly.
const parseMacMounts = (out) => {
	const ret = [];

	String(out || '').split('\n').forEach(line => {
		const m = line.match(/ on (.+) \(([^,)]+)/);
		if (m) {
			ret.push({ mnt: m[1], type: m[2].trim() });
		};
	});
	return ret;
};

// Linux /proc/self/mounts: "device mountpoint fstype options 0 0", with octal escapes for spaces and tabs.
const parseLinuxMounts = (text) => {
	const ret = [];

	String(text || '').split('\n').forEach(line => {
		const parts = line.split(' ');
		if (parts.length < 3) {
			return;
		};

		const unescape = (s) => s.replace(/\\([0-7]{3})/g, (m, oct) => String.fromCharCode(parseInt(oct, 8)));
		ret.push({ dev: unescape(parts[0]), mnt: unescape(parts[1]), type: parts[2] });
	});
	return ret;
};

// Longest mount point containing p. lastWins picks the later of two entries for the same point: on Linux
// that is the mount on top.
const findMount = (p, entries, lastWins) => {
	p = String(p || '');

	let best = null;

	for (const entry of (entries || [])) {
		const mnt = String(entry.mnt || '');
		if (!mnt) {
			continue;
		};

		const pref = mnt.endsWith('/') ? mnt : (mnt + '/');
		if ((p != mnt) && !p.startsWith(pref)) {
			continue;
		};

		if (!best || (mnt.length > best.mnt.length) || (lastWins && (mnt.length == best.mnt.length))) {
			best = entry;
		};
	};
	return best;
};

// Whether mount is on the volume the OS boots from: true, false, or null when that cannot be told.
// macOS: user data is on the Data volume, which /Users etc. reach through firmlinks, so a path there
// resolves to "/" in the mount table.
// Linux: same block device as "/". That keeps /home on a Btrfs subvolume of the root filesystem on the
// system drive (st_dev would not: every subvolume gets its own). Without a /dev source on both sides
// (overlay, tmpfs, sandboxes) the answer is null, not a guess.
const isSystemVolume = (mount, platform, entries) => {
	if (!mount) {
		return null;
	};
	if (platform == 'darwin') {
		return [ '/', '/System/Volumes/Data' ].includes(mount.mnt);
	};
	if (mount.mnt == '/') {
		return true;
	};

	const root = findMount('/', entries, true);
	const isDevice = (dev) => /^\/dev\//.test(String(dev || ''));

	if (!root || !isDevice(root.dev) || !isDevice(mount.dev)) {
		return null;
	};
	return mount.dev == root.dev;
};

// --- Vault location classification ---
// Pure: every read it needs (Dropbox folders, mount tables, statfs) comes in through ctx, so the synchronous
// vault location check and the asynchronous diagnostics share it, each with its own I/O.

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

// macOS mount names that mean a remote filesystem.
const MAC_REMOTE_FSTYPES = { smbfs: 'SMB', nfs: 'NFS', webdav: 'WebDAV', afpfs: 'AFP', ftp: 'FTP' };

// Every provider name the classifier can produce; anything else is reported as 'Other'
const KNOWN_PROVIDERS = new Set([
	...CLOUD_MARKERS.map(it => it[1]),
	...Object.values(NET_MAGIC),
	...Object.values(LINUX_REMOTE_FSTYPES),
	...Object.values(MAC_REMOTE_FSTYPES),
	NETWORK_DRIVE,
	'Cloud storage',
]);

const pathFor = (platform) => (platform == 'win32') ? path.win32 : path.posix;

// Windows realpath can return long-path form: "\\?\C:\..." or "\\?\UNC\server\share".
// Normalize it or every Windows path would match the UNC test.
const stripLongPath = (p) => String(p || '').replace(/^\\\\\?\\UNC\\/i, '\\\\').replace(/^\\\\\?\\/, '');

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

// Where Dropbox keeps info.json, which names its real folder(s) whatever they are called
const dropboxInfoFiles = (platform, env, home) => {
	const P = pathFor(platform);

	if (platform == 'win32') {
		return [ env.APPDATA, env.LOCALAPPDATA ].filter(Boolean).map(d => P.join(d, 'Dropbox', 'info.json'));
	};
	return [ P.join(String(home || ''), '.dropbox', 'info.json') ];
};

const parseDropboxInfo = (text) => {
	try {
		const data = JSON.parse(text);
		return Object.keys(data).filter(k => data[k] && data[k].path).map(k => data[k].path);
	} catch (e) {
		return [];
	};
};

// A ctx reader that is missing or throws reads as "nothing known"
const read = (fn, ...args) => {
	try {
		return (typeof fn == 'function') ? fn(...args) : null;
	} catch (e) {
		return null;
	};
};

const networkTypeOf = (p, ctx) => {
	const platform = ctx.platform;

	// Windows: UNC path (\\server\share), or a drive letter already known to be a mapped network drive.
	if (platform == 'win32') {
		const t = winNetworkType(p, ctx.drives, ctx.systemLetter);
		if (t) {
			return t;
		};
	};

	// Linux: fstype from the mount table is authoritative (distinguishes remote FUSE from local FUSE).
	if (platform == 'linux') {
		const mount = findMount(p, read(ctx.linuxMounts), true);
		if (mount && mount.type) {
			return LINUX_REMOTE_FSTYPES[mount.type] || '';
		};
	};

	// Fallback: statfs f_type magic.
	const magic = read(ctx.statfsType, p);
	if ((magic !== null) && NET_MAGIC[Number(magic) >>> 0]) {
		return NET_MAGIC[Number(magic) >>> 0];
	};

	// macOS: statfs.type is not a usable name — parse the mount table instead.
	if (platform == 'darwin') {
		const mount = findMount(p, read(ctx.macMounts), false);
		if (mount && MAC_REMOTE_FSTYPES[mount.type]) {
			return MAC_REMOTE_FSTYPES[mount.type];
		};
	};

	return '';
};

// Classifies a path (already through realpath, when that worked) as a cloud-synced or network location.
// ctx: { platform, home, env, resolved, drives, systemLetter, and the readers dropboxFolders(), linuxMounts(),
// macMounts(), statfsType(p) }. Readers are called lazily, only when the check before did not decide.
// Returns { unsafe, kind: ''|'cloud'|'network', provider, path, resolved }.
const classifyVaultPath = (p, ctx) => {
	ctx = ctx || {};

	const P = pathFor(ctx.platform);
	const env = ctx.env || {};
	const home = String(ctx.home || '');
	const sep = P.sep;

	p = stripLongPath(p);

	const result = { unsafe: false, kind: '', provider: '', path: p, resolved: !!ctx.resolved };
	const lc = p.toLowerCase();
	const startsWith = (base) => !!base && lc.startsWith(String(base).toLowerCase().replace(/[\/\\]+$/, '') + sep);

	// Cloud: canonical macOS File Provider roots
	const cloudStorage = P.join(home, 'Library', 'CloudStorage');    // Dropbox, GoogleDrive-*, OneDrive-*, Box
	const mobileDocs = P.join(home, 'Library', 'Mobile Documents');  // iCloud Drive

	if (home && startsWith(cloudStorage)) {
		const seg = (p.slice(cloudStorage.length + 1).split(sep)[0]) || '';
		return { ...result, unsafe: true, kind: 'cloud', provider: providerFromSegment(seg) || 'Cloud storage' };
	};
	if (home && startsWith(mobileDocs)) {
		return { ...result, unsafe: true, kind: 'cloud', provider: 'iCloud Drive' };
	};

	// Cloud: OneDrive env vars (Windows)
	for (const v of [ 'OneDrive', 'OneDriveConsumer', 'OneDriveCommercial' ]) {
		if (startsWith(env[v])) {
			return { ...result, unsafe: true, kind: 'cloud', provider: 'OneDrive' };
		};
	};

	// Cloud: Dropbox info.json real path(s)
	for (const dp of (read(ctx.dropboxFolders) || [])) {
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
	const net = networkTypeOf(p, ctx);
	if (net) {
		return { ...result, unsafe: true, kind: 'network', provider: net };
	};

	return result;
};

const normalizeForCompare = (p, platform) => {
	let s = String(p || '');

	if (platform == 'win32') {
		s = s.replace(/^\\\\\?\\UNC\\/i, '\\\\').replace(/^\\\\\?\\/, '').replace(/\//g, '\\').replace(/\\+$/, '');
	} else {
		s = s.replace(/\/+$/, '');
	};

	// Windows and default macOS volumes are case-insensitive
	return ((platform == 'win32') || (platform == 'darwin')) ? s.toLowerCase() : s;
};

// p is one of the places the app puts data by default: the default userData itself, or its data folder
// (plain, or per alpha/beta channel). Anything else, a DATA_PATH inside userData included, is a moved location.
const isDefaultDataPath = (p, defaultUserData, platform) => {
	const a = normalizeForCompare(p, platform);
	const b = normalizeForCompare(defaultUserData, platform);
	const sep = (platform == 'win32') ? '\\' : '/';

	if (!a || !b) {
		return false;
	};
	return [ b, `${b}${sep}data`, `${b}${sep}alpha${sep}data`, `${b}${sep}beta${sep}data` ].includes(a);
};

const tri = (v) => ((v === true) || (v === false)) ? v : null;

// Windows drive types that are the OS's own word for a local device
const LOCAL_DRIVE_TYPES = [ 'fixed', 'removable', 'other' ];

// Flags only: the path never makes it into the result. Every field is set, unknowns explicitly.
// check: vault path classification ({ kind: ''|'cloud'|'network', provider, resolved }).
// drive: Windows drive info, or null. mount: macOS/Linux mount table entry, or null.
// 'local' needs positive evidence: a local Windows drive type, or a filesystem on LOCAL_FS_TYPES, and no
// incomplete read (param.incomplete) that could have found a cloud folder instead.
const buildStorageInfo = (param) => {
	param = param || {};

	const check = param.check || {};
	const drive = param.drive || null;
	const mount = param.mount || null;
	const known = param.knownProviders || KNOWN_PROVIDERS;
	const isDefaultWorkdir = !!param.isDefaultWorkdir;

	// Provider names are ours (cloud markers, network fs names); anything else, e.g. a File Provider
	// folder named after an account, is reported as 'Other' and never verbatim
	const providerOf = (kind) => {
		let provider = String(check.provider || '');
		if (!provider && (kind == 'network')) {
			provider = NETWORK_DRIVE;
		};
		return (provider && known && !known.has(provider)) ? 'Other' : provider;
	};

	// Unresolvable path (dead link, missing folder, access denied on the way): the drive or mount under the
	// unresolved path may be the link's, not the data's, so fs, bus and system drive are unknown. A cloud or
	// network verdict the path itself carries (a UNC path, a cloud folder name) still stands
	if (check.resolved === false) {
		const kind = ((check.kind == 'cloud') || (check.kind == 'network')) ? check.kind : UNKNOWN;
		const driveType = (kind == 'network') ? 'remote' : UNKNOWN;

		return { kind, provider: providerOf(kind), driveType, fsType: UNKNOWN, busType: UNKNOWN, onSystemDrive: null, isDefaultWorkdir };
	};

	const fsType = drive ? fsTypeOf(drive.fsType) : (mount ? fsTypeOf(mount.type) : UNKNOWN);

	let driveType = drive ? (drive.driveType || UNKNOWN) : ((check.kind == 'network') ? 'remote' : UNKNOWN);
	let kind = UNKNOWN;

	if ((check.kind == 'cloud') || (check.kind == 'network')) {
		kind = check.kind;
	} else
	if (driveType == 'remote') {
		kind = 'network';
	} else
	if (drive ? LOCAL_DRIVE_TYPES.includes(driveType) : LOCAL_FS_TYPES.has(fsType)) {
		// incomplete: a read that could rule out a cloud folder failed, so local is not established
		kind = param.incomplete ? UNKNOWN : 'local';
	};

	if ((kind == 'network') && (driveType == UNKNOWN)) {
		driveType = 'remote';
	};

	const provider = providerOf(kind);

	let busType = drive ? busTypeOf(drive.busType) : UNKNOWN;

	if ((driveType == 'remote') && (busType == UNKNOWN)) {
		busType = 'network';
	};

	return {
		kind,
		provider,
		driveType,
		fsType,
		busType,
		onSystemDrive: tri(param.onSystemDrive),
		isDefaultWorkdir,
	};
};

// --- Diagnostics: asynchronous, never on the renderer thread ---

const IO_TIMEOUT = 2000;
const INFO_CACHE_TTL = 60 * 1000;
const INFO_CACHE_HUNG_TTL = 10 * 60 * 1000;

// Resolves with what fn() resolves with, or with fallback when it rejects, throws or takes longer than ms.
// A call that hangs keeps its libuv thread, but nothing waits for it.
const withTimeout = (fn, ms, fallback, onTimeout) => new Promise(resolve => {
	const timer = setTimeout(() => {
		if (onTimeout) {
			onTimeout();
		};
		resolve(fallback);
	}, ms);

	const done = (v) => {
		clearTimeout(timer);
		resolve(v);
	};

	Promise.resolve().then(fn).then(done, () => done(fallback));
});

// Storage flags for diagnostics, built only from asynchronous I/O, each call bounded: a dead mount or a
// redirected profile folder can stall a call, never the renderer. deps:
//   fs (only fs.promises is used), execFile, platform, env, home, drives (createDriveCache), systemLetter,
//   defaultUserData() -> string, timeout (per call), now.
// Returns (input) => Promise<flags>, never rejecting. Results are cached per input, a result that hit a
// timeout for longer, so repeated reports do not pile up stalled calls.
const createStorageInfo = (deps) => {
	deps = deps || {};

	const { fs, platform } = deps;
	const env = deps.env || {};
	const timeout = deps.timeout || IO_TIMEOUT;
	const now = deps.now || Date.now;
	const cache = new Map();

	const lookup = async (input) => {
		let timedOut = false;

		const bounded = (fn, fallback) => withTimeout(fn, timeout, fallback, () => { timedOut = true; });

		// '' for a file that is not there, null for one that could not be read (timeout, other error):
		// a missing Dropbox info.json means no Dropbox, an unreadable one means it is not known
		const readOptional = (file) => bounded(() => fs.promises.readFile(file, 'utf8').catch(e => {
			if (e && [ 'ENOENT', 'ENOTDIR' ].includes(e.code)) {
				return '';
			};
			throw e;
		}), null);

		const readMounts = () => {
			if (platform == 'linux') {
				return bounded(() => fs.promises.readFile('/proc/self/mounts', 'utf8'), '').then(text => text ? parseLinuxMounts(text) : null);
			};
			if (platform == 'darwin') {
				const run = () => new Promise((resolve, reject) => {
					deps.execFile('/sbin/mount', [], { encoding: 'utf8', timeout }, (err, stdout) => err ? reject(err) : resolve(stdout));
				});
				return bounded(run, '').then(out => out ? parseMacMounts(out) : null);
			};
			return Promise.resolve(null);
		};

		const [ real, dropboxTexts, mounts ] = await Promise.all([
			bounded(() => fs.promises.realpath(input), null),
			Promise.all(dropboxInfoFiles(platform, env, deps.home).map(readOptional)),
			readMounts(),
		]);

		const dropbox = dropboxTexts.flatMap(t => t ? parseDropboxInfo(t) : []);

		const resolved = (real !== null);
		const p = resolved ? String(real) : input;
		const canStatfs = resolved && fs.promises && (typeof fs.promises.statfs == 'function');
		const magic = canStatfs ? await bounded(() => fs.promises.statfs(p).then(st => Number(st.type) >>> 0), null) : null;

		// Windows: wait for the drive lookup (bounded by its own timeout) so the verdict below is final
		const letter = ((platform == 'win32') && resolved) ? winDriveLetter(stripLongPath(p)) : '';
		const drive = (letter && deps.drives) ? await deps.drives.get(letter) : null;

		const check = classifyVaultPath(p, {
			platform,
			env,
			home: deps.home,
			resolved,
			drives: deps.drives,
			systemLetter: deps.systemLetter,
			dropboxFolders: () => dropbox,
			linuxMounts: () => mounts,
			macMounts: () => mounts,
			statfsType: () => magic,
		});

		const param = {
			check,
			isDefaultWorkdir: isDefaultDataPath(input, read(deps.defaultUserData), platform),
			// Without the Dropbox folders a custom-named Dropbox root would pass for local. The other reads
			// decide 'local' themselves: no mount table or drive type, no local fs type. statfs only backs up
			// a missing mount entry, which reads unknown already
			incomplete: dropboxTexts.includes(null),
		};

		if (!resolved) {
			return { info: buildStorageInfo(param), timedOut };
		};

		if (platform == 'win32') {
			const isUnc = isUncPath(check.path);

			param.drive = letter ? drive : (isUnc ? REMOTE_DRIVE : null);
			param.onSystemDrive = letter ? (letter == systemLetterOf(deps.systemLetter)) : (isUnc ? false : null);
		} else {
			param.mount = findMount(check.path, mounts, platform == 'linux');
			param.onSystemDrive = isSystemVolume(param.mount, platform, mounts);
		};

		return { info: buildStorageInfo(param), timedOut };
	};

	return (input) => {
		const key = String(input || '');
		const hit = cache.get(key);

		if (hit && ((now() - hit.time) < hit.ttl)) {
			return hit.promise;
		};

		const entry = { time: now(), ttl: INFO_CACHE_TTL, promise: null };

		entry.promise = Promise.resolve()
			.then(() => lookup(key))
			.then(ret => {
				entry.ttl = ret.timedOut ? INFO_CACHE_HUNG_TTL : INFO_CACHE_TTL;
				return ret.info;
			})
			.catch(() => buildStorageInfo({}));

		if (cache.size >= 20) {
			cache.delete(cache.keys().next().value);
		};
		cache.set(key, entry);
		return entry.promise;
	};
};

module.exports = {
	UNKNOWN,
	NETWORK_DRIVE,
	REMOTE_DRIVE,
	POWERSHELL_TIMEOUT,
	winDriveLetter,
	isUncPath,
	winDriveScript,
	parseWinDriveOutput,
	powershellPath,
	runPowerShell,
	createDriveCache,
	winNetworkType,
	winClassifyPending,
	LOCAL_FS_TYPES,
	OTHER_FS_TYPES,
	BUS_TYPES,
	fsTypeOf,
	busTypeOf,
	parseMacMounts,
	parseLinuxMounts,
	findMount,
	isSystemVolume,
	isDefaultDataPath,
	KNOWN_PROVIDERS,
	dropboxInfoFiles,
	parseDropboxInfo,
	classifyVaultPath,
	buildStorageInfo,
	withTimeout,
	createStorageInfo,
};
