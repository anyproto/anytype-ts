import { describe, expect, it, vi } from 'vitest';
import Probe from '../js/storageProbe.cjs';

const MAC_MOUNTS = [
	'/dev/disk3s1s1 on / (apfs, sealed, local, read-only, journaled)',
	'devfs on /dev (devfs, local, nobrowse)',
	'/dev/disk3s5 on /System/Volumes/Data (apfs, local, journaled, nobrowse, protect, root data)',
	'map auto_home on /System/Volumes/Data/home (autofs, automounted, nobrowse)',
	'//roman@nas/share on /Volumes/share (smbfs, nodev, nosuid, mounted by roman)',
	'/dev/disk4s1 on /Volumes/T7 (exfat, local, nodev, nosuid, noowners, noatime, fskit)',
	'/dev/disk5s1 on /Volumes/Disk (1) (apfs, local, nodev, nosuid, journaled, noowners)',
].join('\n');

const LINUX_MOUNTS = [
	'/dev/nvme0n1p2 / ext4 rw,relatime 0 0',
	'proc /proc proc rw,nosuid,nodev,noexec,relatime 0 0',
	'/dev/sda1 /media/roman/My\\040Drive exfat rw,nosuid,nodev,relatime 0 0',
	'nas:/export /mnt/nas nfs4 rw,relatime 0 0',
	'/dev/sdb1 /mnt/nas fuseblk rw,relatime 0 0',
].join('\n');

const KNOWN = new Set([ 'Dropbox', 'OneDrive', 'SMB', 'NFS', Probe.NETWORK_DRIVE ]);

// A fake execFile: answers through the callback like child_process.execFile does
const fakeExecFile = (err: any, stdout: string) => vi.fn((file: string, args: string[], options: any, cb: any) => {
	setTimeout(() => cb(err, stdout, ''), 0);
	return { stdout: { on: () => {} }, on: () => {} };
});

describe('winDriveLetter', () => {
	it('reads the letter of an absolute drive path', () => {
		expect(Probe.winDriveLetter('C:\\Users\\me\\AppData\\Roaming\\anytype')).toBe('C');
		expect(Probe.winDriveLetter('z:/anytype')).toBe('Z');
		expect(Probe.winDriveLetter('D:')).toBe('D');
	});

	it('returns nothing for UNC, relative and posix paths', () => {
		expect(Probe.winDriveLetter('\\\\server\\share\\anytype')).toBe('');
		expect(Probe.winDriveLetter('C:relative')).toBe('');
		expect(Probe.winDriveLetter('/Users/me')).toBe('');
		expect(Probe.winDriveLetter('')).toBe('');
	});
});

describe('isUncPath', () => {
	it('detects both slash styles', () => {
		expect(Probe.isUncPath('\\\\server\\share')).toBe(true);
		expect(Probe.isUncPath('//server/share')).toBe(true);
		expect(Probe.isUncPath('C:\\Users')).toBe(false);
		expect(Probe.isUncPath('/Users')).toBe(false);
	});
});

describe('winDriveScript', () => {
	it('embeds the normalized letter', () => {
		const script = Probe.winDriveScript('d');

		expect(script).toContain(`$l = 'D'`);
		expect(script).toContain('System.IO.DriveInfo');
		expect(script).toContain('Win32_LogicalDisk');
		expect(script).toContain('Get-Partition -DriveLetter $l');
	});

	it('refuses anything that is not a single letter', () => {
		expect(Probe.winDriveScript('')).toBe('');
		expect(Probe.winDriveScript('CD')).toBe('');
		expect(Probe.winDriveScript(`C'; Remove-Item x; '`)).toBe('');
		expect(Probe.winDriveScript('1')).toBe('');
	});

	it('survives Windows command line quoting unchanged', () => {
		// Node quotes the argument for CreateProcess; only double quotes and backslashes get rewritten
		expect(Probe.winDriveScript('C')).not.toMatch(/["\\]/);
	});

	it('writes the drive line before the slow bus lookup', () => {
		const script = Probe.winDriveScript('C');

		expect(script.indexOf(`'D|'`)).toBeGreaterThan(0);
		expect(script.indexOf(`'D|'`)).toBeLessThan(script.indexOf('Get-Partition'));
	});
});

describe('parseWinDriveOutput', () => {
	it('parses a local NVMe system drive', () => {
		const want = { driveType: 'fixed', fsType: 'ntfs', busType: 'nvme' };

		expect(Probe.parseWinDriveOutput('D|Fixed|NTFS\r\nB|NVMe\r\n')).toEqual(want);
	});

	it('parses an exFAT USB stick', () => {
		const want = { driveType: 'removable', fsType: 'exfat', busType: 'usb' };

		expect(Probe.parseWinDriveOutput('D|Removable|exFAT\r\nB|USB\r\n')).toEqual(want);
	});

	it('parses an external USB SSD, which Windows reports as fixed', () => {
		const want = { driveType: 'fixed', fsType: 'exfat', busType: 'usb' };

		expect(Probe.parseWinDriveOutput('D|Fixed|exFAT\nB|USB')).toEqual(want);
	});

	it('parses a mapped network drive, which has no bus line', () => {
		const want = { driveType: 'remote', fsType: 'ntfs', busType: 'network' };

		expect(Probe.parseWinDriveOutput('D|Network|NTFS\r\n')).toEqual(want);
	});

	it('parses the CIM fallback codes and numeric bus types', () => {
		expect(Probe.parseWinDriveOutput('D|4|NTFS')).toEqual({ driveType: 'remote', fsType: 'ntfs', busType: 'network' });
		expect(Probe.parseWinDriveOutput('D|3|FAT32\nB|11')).toEqual({ driveType: 'fixed', fsType: 'fat32', busType: 'sata' });
		expect(Probe.parseWinDriveOutput('D|2|exFAT\nB|7')).toEqual({ driveType: 'removable', fsType: 'exfat', busType: 'usb' });
		expect(Probe.parseWinDriveOutput('D|5|CDFS\nB|99')).toEqual({ driveType: 'other', fsType: 'cdfs', busType: 'unknown' });
	});

	it('normalizes multi-word bus names', () => {
		expect(Probe.parseWinDriveOutput('D|Fixed|NTFS\nB|File Backed Virtual').busType).toBe('file_backed_virtual');
		expect(Probe.parseWinDriveOutput('D|Fixed|ReFS\nB|Storage Spaces')).toEqual({ driveType: 'fixed', fsType: 'refs', busType: 'storage_spaces' });
	});

	it('keeps the drive line when the bus lookup was killed by the timeout', () => {
		const want = { driveType: 'fixed', fsType: 'ntfs', busType: 'unknown' };

		expect(Probe.parseWinDriveOutput('D|Fixed|NTFS\r\n')).toEqual(want);
	});

	it('reports unknown, never local, for missing or garbled output', () => {
		const want = { driveType: 'unknown', fsType: 'unknown', busType: 'unknown' };

		expect(Probe.parseWinDriveOutput('')).toEqual(want);
		expect(Probe.parseWinDriveOutput(null)).toEqual(want);
		expect(Probe.parseWinDriveOutput('D||\nB|')).toEqual(want);
		expect(Probe.parseWinDriveOutput('D|NoRootDirectory|\nB|')).toEqual(want);
		expect(Probe.parseWinDriveOutput('Preparing modules for first use.\nsomething|else')).toEqual(want);
	});
});

describe('runPowerShell', () => {
	it('runs the system PowerShell hidden, without profile, with a timeout', async () => {
		const execFile = fakeExecFile(null, 'D|Fixed|NTFS\r\n');

		await expect(Probe.runPowerShell('script', { execFile, timeout: 1234, env: { SystemRoot: 'C:\\Windows' } })).resolves.toBe('D|Fixed|NTFS\r\n');

		const [ file, args, options ] = execFile.mock.calls[0];

		expect(file).toBe('C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe');
		expect(args).toEqual([ '-NoLogo', '-NoProfile', '-NonInteractive', '-Command', 'script' ]);
		expect(options).toMatchObject({ timeout: 1234, windowsHide: true });
	});

	it('returns the partial output of a run killed by the timeout', async () => {
		const execFile = fakeExecFile(Object.assign(new Error('timeout'), { killed: true }), 'D|Network|NTFS\r\n');

		await expect(Probe.runPowerShell('script', { execFile, timeout: 10 })).resolves.toBe('D|Network|NTFS\r\n');
	});

	it('resolves empty when PowerShell cannot be started', async () => {
		const execFile = vi.fn(() => {
			throw new Error('spawn ENOENT');
		});

		await expect(Probe.runPowerShell('script', { execFile, timeout: 10 })).resolves.toBe('');
	});

	it('resolves from the guard when the callback never comes', async () => {
		vi.useFakeTimers();

		try {
			const execFile = vi.fn(() => ({ stdout: { on: (e: string, fn: any) => fn('D|Fixed|') }, on: () => {} }));
			const promise = Probe.runPowerShell('script', { execFile, timeout: 100 });

			await vi.advanceTimersByTimeAsync(1100);
			await expect(promise).resolves.toBe('D|Fixed|');
		} finally {
			vi.useRealTimers();
		};
	});
});

describe('createDriveCache', () => {
	it('runs one lookup for concurrent requests and caches the result', async () => {
		const lookup = vi.fn(async () => 'D|Fixed|NTFS\nB|NVMe');
		const cache = Probe.createDriveCache({ lookup });
		const want = { driveType: 'fixed', fsType: 'ntfs', busType: 'nvme' };

		const [ a, b ] = await Promise.all([ cache.get('c'), cache.get('C') ]);

		expect(a).toEqual(want);
		expect(b).toEqual(want);
		expect(await cache.get('C')).toEqual(want);
		expect(lookup).toHaveBeenCalledTimes(1);
		expect(lookup).toHaveBeenCalledWith('C');
	});

	it('peek never waits: null first, the info once the lookup landed', async () => {
		const lookup = vi.fn(async () => 'D|Network|NTFS');
		const cache = Probe.createDriveCache({ lookup });

		expect(cache.peek('Z')).toBe(null);
		expect(cache.known('Z')).toBe(false);

		await cache.get('Z');

		expect(cache.peek('Z')).toEqual({ driveType: 'remote', fsType: 'ntfs', busType: 'network' });
		expect(cache.known('Z')).toBe(true);
		expect(lookup).toHaveBeenCalledTimes(1);
	});

	it('refreshes after the ttl and keeps serving the stale info meanwhile', async () => {
		let time = 0;
		const outputs = [ 'D|Fixed|NTFS', 'D|Network|NTFS' ];
		const lookup = vi.fn(async () => outputs.shift());
		const cache = Probe.createDriveCache({ lookup, now: () => time, ttl: 1000, failTtl: 100 });

		await cache.get('E');
		time = 2000;

		expect(cache.peek('E')).toEqual({ driveType: 'fixed', fsType: 'ntfs', busType: 'unknown' });
		expect(await cache.get('E')).toEqual({ driveType: 'remote', fsType: 'ntfs', busType: 'network' });
		expect(lookup).toHaveBeenCalledTimes(2);
	});

	it('caches a failed lookup as unknown, for the shorter ttl', async () => {
		let time = 0;
		const lookup = vi.fn(async () => {
			throw new Error('blocked by policy');
		});
		const cache = Probe.createDriveCache({ lookup, now: () => time, ttl: 1000, failTtl: 100 });
		const want = { driveType: 'unknown', fsType: 'unknown', busType: 'unknown' };

		expect(await cache.get('C')).toEqual(want);
		time = 50;
		expect(await cache.get('C')).toEqual(want);
		expect(lookup).toHaveBeenCalledTimes(1);

		time = 200;
		await cache.get('C');
		expect(lookup).toHaveBeenCalledTimes(2);
	});

	it('does not look anything up for an invalid letter', async () => {
		const lookup = vi.fn(async () => 'D|Fixed|NTFS');
		const cache = Probe.createDriveCache({ lookup });

		expect(await cache.get('')).toEqual({ driveType: 'unknown', fsType: 'unknown', busType: 'unknown' });
		expect(cache.peek('CD')).toBe(null);
		expect(lookup).not.toHaveBeenCalled();
	});
});

describe('winNetworkType and winClassifyPending', () => {
	const cacheWith = async (out: string) => {
		const cache = Probe.createDriveCache({ lookup: async () => out });

		await cache.get('Z');
		return cache;
	};

	it('treats UNC paths as network without a lookup', () => {
		const lookup = vi.fn();
		const cache = Probe.createDriveCache({ lookup });

		expect(Probe.winNetworkType('\\\\nas\\share\\anytype', cache, 'C')).toBe(Probe.NETWORK_DRIVE);
		expect(lookup).not.toHaveBeenCalled();
	});

	it('flags a mapped network drive letter once its lookup landed', async () => {
		const cache = await cacheWith('D|Network|NTFS');

		expect(Probe.winNetworkType('Z:\\anytype\\data', cache, 'C')).toBe(Probe.NETWORK_DRIVE);
		expect(Probe.winClassifyPending({ kind: '', path: 'Z:\\anytype\\data' }, cache, 'C')).toBe('');
	});

	it('does not flag local drives, USB included', async () => {
		expect(Probe.winNetworkType('Z:\\anytype', await cacheWith('D|Fixed|NTFS\nB|USB'), 'C')).toBe('');
		expect(Probe.winNetworkType('Z:\\anytype', await cacheWith('D|Removable|exFAT\nB|USB'), 'C')).toBe('');
	});

	it('marks the answer for an unlooked-up letter as provisional and starts the lookup', async () => {
		const lookup = vi.fn(async () => 'D|Network|NTFS');
		const cache = Probe.createDriveCache({ lookup });
		const check = { kind: '', path: 'Y:\\anytype' };

		expect(Probe.winNetworkType(check.path, cache, 'C')).toBe('');
		expect(Probe.winClassifyPending(check, cache, 'C')).toBe('Y');

		// get() joins the lookup peek() started instead of running a second one
		await cache.get('Y');

		expect(lookup).toHaveBeenCalledTimes(1);
		expect(lookup).toHaveBeenCalledWith('Y');
		expect(Probe.winClassifyPending(check, cache, 'C')).toBe('');
		expect(Probe.winNetworkType(check.path, cache, 'C')).toBe(Probe.NETWORK_DRIVE);
	});

	it('never looks up the system drive, which cannot be a mapped share', () => {
		const lookup = vi.fn(async () => 'D|Network|NTFS');
		const cache = Probe.createDriveCache({ lookup });
		const check = { kind: '', path: 'C:\\Users\\me\\AppData\\Roaming\\anytype\\data' };

		expect(Probe.winNetworkType(check.path, cache, 'C:')).toBe('');
		expect(Probe.winClassifyPending(check, cache, 'c')).toBe('');
		expect(lookup).not.toHaveBeenCalled();
	});

	it('never marks a cloud or UNC result as provisional', () => {
		const cache = Probe.createDriveCache({ lookup: async () => '' });

		expect(Probe.winClassifyPending({ kind: 'cloud', path: 'D:\\Dropbox' }, cache, 'C')).toBe('');
		expect(Probe.winClassifyPending({ kind: '', path: '\\\\nas\\share' }, cache, 'C')).toBe('');
	});
});

describe('mount tables', () => {
	it('parses macOS mount output, mount points with " (" included', () => {
		const mounts = Probe.parseMacMounts(MAC_MOUNTS);

		expect(mounts).toContainEqual({ mnt: '/', type: 'apfs' });
		expect(mounts).toContainEqual({ mnt: '/Volumes/share', type: 'smbfs' });
		expect(mounts).toContainEqual({ mnt: '/Volumes/Disk (1)', type: 'apfs' });
	});

	it('finds the longest macOS mount point', () => {
		const mounts = Probe.parseMacMounts(MAC_MOUNTS);

		expect(Probe.findMount('/Users/me/Library/Application Support/anytype/data', mounts, false)).toEqual({ mnt: '/', type: 'apfs' });
		expect(Probe.findMount('/Volumes/T7/anytype', mounts, false)).toEqual({ mnt: '/Volumes/T7', type: 'exfat' });
		expect(Probe.findMount('/Volumes/T7', mounts, false)).toEqual({ mnt: '/Volumes/T7', type: 'exfat' });
		expect(Probe.findMount('/Volumes/T70/anytype', mounts, false)).toEqual({ mnt: '/', type: 'apfs' });
		expect(Probe.findMount('/Volumes/Disk (1)/anytype', mounts, false)).toEqual({ mnt: '/Volumes/Disk (1)', type: 'apfs' });
	});

	it('parses Linux mounts with escapes and picks the mount on top', () => {
		const mounts = Probe.parseLinuxMounts(LINUX_MOUNTS);

		expect(Probe.findMount('/media/roman/My Drive/anytype', mounts, true)).toEqual({ mnt: '/media/roman/My Drive', type: 'exfat' });
		expect(Probe.findMount('/mnt/nas/anytype', mounts, true)).toEqual({ mnt: '/mnt/nas', type: 'fuseblk' });
		expect(Probe.findMount('/home/roman/.config/anytype', mounts, true)).toEqual({ mnt: '/', type: 'ext4' });
	});

	it('returns null without a table', () => {
		expect(Probe.findMount('/x', null, true)).toBe(null);
		expect(Probe.findMount('/x', [], false)).toBe(null);
	});

	it('knows the boot volume', () => {
		expect(Probe.isSystemMount('/', 'darwin')).toBe(true);
		expect(Probe.isSystemMount('/System/Volumes/Data', 'darwin')).toBe(true);
		expect(Probe.isSystemMount('/Volumes/T7', 'darwin')).toBe(false);
		expect(Probe.isSystemMount('/', 'linux')).toBe(true);
		expect(Probe.isSystemMount('/home', 'linux')).toBe(false);
	});
});

describe('isInside', () => {
	it('compares Windows paths case-insensitively, either slash, long-path prefix stripped', () => {
		const base = 'C:\\Users\\Me\\AppData\\Roaming\\anytype';

		expect(Probe.isInside('c:\\users\\me\\appdata\\roaming\\Anytype\\data', base, 'win32')).toBe(true);
		expect(Probe.isInside('C:/Users/Me/AppData/Roaming/anytype/beta/data', base, 'win32')).toBe(true);
		expect(Probe.isInside('\\\\?\\C:\\Users\\Me\\AppData\\Roaming\\anytype', base, 'win32')).toBe(true);
		expect(Probe.isInside('C:\\Users\\Me\\AppData\\Roaming\\anytype2\\data', base, 'win32')).toBe(false);
		expect(Probe.isInside('D:\\anytype\\data', base, 'win32')).toBe(false);
	});

	it('is case-sensitive on Linux', () => {
		expect(Probe.isInside('/home/me/.config/anytype/data', '/home/me/.config/anytype/', 'linux')).toBe(true);
		expect(Probe.isInside('/home/me/.config/Anytype/data', '/home/me/.config/anytype', 'linux')).toBe(false);
	});

	it('is false for empty input', () => {
		expect(Probe.isInside('', '/a', 'linux')).toBe(false);
		expect(Probe.isInside('/a', '', 'linux')).toBe(false);
	});
});

describe('buildStorageInfo', () => {
	const KEYS = [ 'busType', 'driveType', 'fsType', 'isDefaultWorkdir', 'kind', 'onSystemDrive', 'provider' ];
	const local = (path: string) => ({ unsafe: false, kind: '', provider: '', path });

	it('returns flags only, never the path', () => {
		const path = 'D:\\Secret Project\\anytype\\data';
		const got = Probe.buildStorageInfo({
			check: local(path),
			drive: { driveType: 'fixed', fsType: 'exfat', busType: 'usb' },
			netKnown: true,
			onSystemDrive: false,
			isDefaultWorkdir: false,
			knownProviders: KNOWN,
		});

		expect(Object.keys(got).sort()).toEqual(KEYS);
		expect(JSON.stringify(got)).not.toContain('Secret');
		expect(JSON.stringify(got)).not.toContain('anytype');
	});

	it('reports a USB SSD as local, with its drive details', () => {
		const want = {
			kind: 'local',
			provider: '',
			driveType: 'fixed',
			fsType: 'exfat',
			busType: 'usb',
			onSystemDrive: false,
			isDefaultWorkdir: false,
		};

		expect(Probe.buildStorageInfo({
			check: local('E:\\anytype'),
			drive: { driveType: 'fixed', fsType: 'exfat', busType: 'usb' },
			netKnown: true,
			onSystemDrive: false,
			knownProviders: KNOWN,
		})).toEqual(want);
	});

	it('turns a mapped drive letter into network even when the classification predates the lookup', () => {
		const want = {
			kind: 'network',
			provider: Probe.NETWORK_DRIVE,
			driveType: 'remote',
			fsType: 'ntfs',
			busType: 'network',
			onSystemDrive: false,
			isDefaultWorkdir: false,
		};

		expect(Probe.buildStorageInfo({
			check: local('Z:\\anytype'),
			drive: Probe.parseWinDriveOutput('D|Network|NTFS'),
			netKnown: true,
			onSystemDrive: false,
			knownProviders: KNOWN,
		})).toEqual(want);
	});

	it('reports unknown, not local, when the drive lookup failed', () => {
		const got = Probe.buildStorageInfo({
			check: local('C:\\Users\\me\\AppData\\Roaming\\anytype\\data'),
			drive: Probe.parseWinDriveOutput(''),
			netKnown: false,
			onSystemDrive: true,
			isDefaultWorkdir: true,
			knownProviders: KNOWN,
		});

		expect(got.kind).toBe('unknown');
		expect(got.driveType).toBe('unknown');
		expect(got.onSystemDrive).toBe(true);
		expect(got.isDefaultWorkdir).toBe(true);
	});

	it('keeps the cloud classification and the drive details', () => {
		const got = Probe.buildStorageInfo({
			check: { unsafe: true, kind: 'cloud', provider: 'OneDrive', path: 'C:\\Users\\me\\OneDrive\\anytype' },
			drive: { driveType: 'fixed', fsType: 'ntfs', busType: 'nvme' },
			netKnown: true,
			onSystemDrive: true,
			knownProviders: KNOWN,
		});

		expect(got).toMatchObject({ kind: 'cloud', provider: 'OneDrive', driveType: 'fixed', fsType: 'ntfs', busType: 'nvme' });
	});

	it('uses the mount table on macOS and Linux', () => {
		const share = Probe.buildStorageInfo({
			check: { unsafe: true, kind: 'network', provider: 'SMB', path: '/Volumes/share/anytype' },
			mount: { mnt: '/Volumes/share', type: 'smbfs' },
			netKnown: true,
			onSystemDrive: false,
			knownProviders: KNOWN,
		});
		const usb = Probe.buildStorageInfo({
			check: local('/Volumes/T7/anytype'),
			mount: { mnt: '/Volumes/T7', type: 'exfat' },
			netKnown: true,
			onSystemDrive: false,
			knownProviders: KNOWN,
		});

		expect(share).toMatchObject({ kind: 'network', provider: 'SMB', driveType: 'remote', fsType: 'smbfs', busType: 'network' });
		expect(usb).toMatchObject({ kind: 'local', provider: '', driveType: 'unknown', fsType: 'exfat', busType: 'unknown' });
	});

	it('reports unknown when no mount was found', () => {
		const got = Probe.buildStorageInfo({ check: local('/data'), mount: null, netKnown: false, onSystemDrive: null, knownProviders: KNOWN });

		expect(got).toMatchObject({ kind: 'unknown', fsType: 'unknown', onSystemDrive: null });
	});

	it('never passes an unknown provider name through', () => {
		const got = Probe.buildStorageInfo({
			check: { unsafe: true, kind: 'cloud', provider: 'roman@example.com', path: '/x' },
			netKnown: true,
			knownProviders: KNOWN,
		});

		expect(got.provider).toBe('Other');
	});

	it('survives missing input', () => {
		const got = Probe.buildStorageInfo(undefined);

		expect(Object.keys(got).sort()).toEqual(KEYS);
		expect(got).toMatchObject({ kind: 'unknown', driveType: 'unknown', fsType: 'unknown', busType: 'unknown', onSystemDrive: null, isDefaultWorkdir: false });
	});
});
