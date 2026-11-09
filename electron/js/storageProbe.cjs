// Where does the vault data physically live: drive type, filesystem, bus. Feeds the storage_* tags on
// middleware reports (MW_DB_CORRUPTION and friends) and the Windows half of the vault location warning.
// Pure helpers plus an injectable PowerShell runner: no electron imports, so electron/ts/storageProbe.test.ts
// can load this file. preload.cjs wires it to the real system.

const { execFile } = require('child_process');

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

// Lowercase identifier safe for a Sentry tag: "File Backed Virtual" -> "file_backed_virtual", "NTFS" -> "ntfs"
const token = (v) => String(v || '').trim().toLowerCase().replace(/[^a-z0-9.]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 32);

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
			ret.fsType = token(parts[2]) || UNKNOWN;
		};

		if ((parts[0] == 'B') && (parts.length >= 2)) {
			const b = String(parts[1] || '').trim();
			ret.busType = /^\d+$/.test(b) ? (WIN_BUS_TYPES[Number(b)] || UNKNOWN) : (token(b) || UNKNOWN);
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

		const mnt = parts[1].replace(/\\([0-7]{3})/g, (s, oct) => String.fromCharCode(parseInt(oct, 8)));
		ret.push({ mnt, type: parts[2] });
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

// The volume the OS boots from. On macOS user data is on the Data volume, which /Users etc. reach through
// firmlinks, so a path there resolves to "/" in the mount table.
const isSystemMount = (mnt, platform) => {
	if (platform == 'darwin') {
		return [ '/', '/System/Volumes/Data' ].includes(mnt);
	};
	return mnt == '/';
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

// p is base itself or inside it. Plain string logic, so "C:\Anytype2" is not inside "C:\Anytype".
const isInside = (p, base, platform) => {
	const a = normalizeForCompare(p, platform);
	const b = normalizeForCompare(base, platform);
	const sep = (platform == 'win32') ? '\\' : '/';

	if (!a || !b) {
		return false;
	};
	return (a == b) || a.startsWith(b + sep);
};

const tri = (v) => ((v === true) || (v === false)) ? v : null;

// Flags only: the path never makes it into the result. Every field is set, unknowns explicitly.
// check: vault path classification ({ kind: ''|'cloud'|'network', provider }).
// drive: Windows drive info, or null. mount: macOS/Linux mount table entry, or null.
// netKnown: whether "no network found" is conclusive (drive type resolved, or mount found).
const buildStorageInfo = (param) => {
	param = param || {};

	const check = param.check || {};
	const drive = param.drive || null;
	const mount = param.mount || null;
	const known = param.knownProviders || null;

	let driveType = drive ? (drive.driveType || UNKNOWN) : ((check.kind == 'network') ? 'remote' : UNKNOWN);
	let kind = '';

	if ((check.kind == 'cloud') || (check.kind == 'network')) {
		kind = check.kind;
	} else
	if (driveType == 'remote') {
		kind = 'network';
	} else {
		kind = param.netKnown ? 'local' : UNKNOWN;
	};

	if ((kind == 'network') && (driveType == UNKNOWN)) {
		driveType = 'remote';
	};

	// Provider names are ours (cloud markers, network fs names); anything else, e.g. a File Provider
	// folder named after an account, is reported as 'Other' and never verbatim
	let provider = String(check.provider || '');
	if (!provider && (kind == 'network')) {
		provider = NETWORK_DRIVE;
	};
	if (provider && known && !known.has(provider)) {
		provider = 'Other';
	};

	const fsType = drive ? (drive.fsType || UNKNOWN) : ((mount && token(mount.type)) || UNKNOWN);
	let busType = drive ? (drive.busType || UNKNOWN) : UNKNOWN;

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
		isDefaultWorkdir: !!param.isDefaultWorkdir,
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
	parseMacMounts,
	parseLinuxMounts,
	findMount,
	isSystemMount,
	isInside,
	buildStorageInfo,
};
