import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { BACKUP_SUFFIX, MAX_CONFIG_BYTES, canonicalPath, isLocalAbsolute, readSnapshot, resolveTarget, writeFileSafe, type Snapshot } from './fsSafe';
import { fakeEnv, modeOf, nodeEnv, tempDir, testLink } from './testEnv';
import type { Env } from './types';

const posix = process.platform != 'win32';
const itPosix = posix ? test : test.skip;

let home = '';
let env: Env;

beforeEach(() => {
	home = tempDir('aic-fs-');
	env = nodeEnv(home);
});

afterEach(() => {
	fs.rmSync(home, { recursive: true, force: true });
});

const snap = (real: string): Snapshot => {
	const s = readSnapshot(env, real);

	if ('error' in s) {
		throw new Error(s.error.category);
	};
	return s;
};

const resolved = (file: string): string => {
	const r = resolveTarget(env, file);

	if ('error' in r) {
		throw new Error(r.error.category);
	};
	return r.real;
};

const leftovers = (dir: string): string[] => fs.readdirSync(dir).filter(n => n.endsWith('.tmp'));

/** Every file under `dir` (recursively) whose content contains `needle` */
const holding = (dir: string, needle: string): string[] => {
	if (!fs.existsSync(dir)) {
		return [];
	};
	return (fs.readdirSync(dir, { recursive: true }) as string[])
		.map(n => path.join(dir, n))
		.filter(p => fs.lstatSync(p).isFile() && fs.readFileSync(p, 'utf8').includes(needle));
};

const SECRET = 'SENTINEL-fs-key-0123456789';

describe('resolveTarget', () => {
	test('a missing file resolves through its nearest existing parent', () => {
		const r = resolveTarget(env, path.join(home, '.cursor', 'mcp.json'));

		expect(r).toEqual({ real: path.join(home, '.cursor', 'mcp.json'), exists: false });
	});

	testLink('a target resolving outside home → outsideHome', () => {
		const outside = tempDir('aic-out-');

		try {
			fs.symlinkSync(outside, path.join(home, '.codex'));

			const r = resolveTarget(env, path.join(home, '.codex', 'config.toml'));
			expect(r).toEqual({ error: { stage: 'read', category: 'outsideHome', path: path.join(home, '.codex', 'config.toml') } });
			expect(resolveTarget(env, path.join(outside, 'x.json'))).toMatchObject({ error: { category: 'outsideHome' } });
		} finally {
			fs.rmSync(outside, { recursive: true, force: true });
		};
	});

	testLink('a link inside home resolves to its real file', () => {
		fs.mkdirSync(path.join(home, 'dotfiles'));
		fs.writeFileSync(path.join(home, 'dotfiles', 'mcp.json'), '{}');
		fs.mkdirSync(path.join(home, '.cursor'));
		fs.symlinkSync(path.join(home, 'dotfiles', 'mcp.json'), path.join(home, '.cursor', 'mcp.json'));

		expect(canonicalPath(env, path.join(home, '.cursor', 'mcp.json'))).toBe(path.join(home, 'dotfiles', 'mcp.json'));
		expect(resolveTarget(env, path.join(home, '.cursor', 'mcp.json'))).toEqual({ real: path.join(home, 'dotfiles', 'mcp.json'), exists: true });
	});
});

describe('writeFileSafe', () => {
	itPosix('a new file is 0600 and new directories 0700, at most two levels', async () => {
		const file = path.join(home, '.cursor', 'mcp.json');
		const res = await writeFileSafe(env, resolved(file), '{}\n', { snapshot: snap(resolved(file)), secret: true });

		expect(res).toEqual({ ok: true, createdDirs: [ path.join(home, '.cursor') ] });
		expect(fs.readFileSync(file, 'utf8')).toBe('{}\n');
		expect(modeOf(file)).toBe(0o600);
		expect(modeOf(path.join(home, '.cursor'))).toBe(0o700);
		expect(fs.existsSync(file + BACKUP_SUFFIX)).toBe(false);

		const deep = path.join(home, 'a', 'b', 'c', 'x.json');
		expect(await writeFileSafe(env, resolved(deep), '{}', { snapshot: snap(resolved(deep)), secret: false })).toMatchObject({ ok: false, error: { category: 'notFound' } });
	});

	itPosix('an existing 0644 file that gains a secret becomes 0600', async () => {
		const file = path.join(home, 'config.toml');

		fs.writeFileSync(file, 'a = 1\n', { mode: 0o644 });
		fs.chmodSync(file, 0o644);

		expect(await writeFileSafe(env, file, 'a = 2\n', { snapshot: snap(file), secret: true })).toMatchObject({ ok: true });
		expect(modeOf(file)).toBe(0o600);
	});

	itPosix('an existing 0644 file without a secret keeps its mode', async () => {
		const file = path.join(home, 'SKILL.md');

		fs.writeFileSync(file, 'old');
		fs.chmodSync(file, 0o644);

		expect(await writeFileSafe(env, file, 'new', { snapshot: snap(file), secret: false })).toMatchObject({ ok: true });
		expect(modeOf(file)).toBe(0o644);
		expect(fs.readFileSync(file, 'utf8')).toBe('new');
	});

	test('the backup of a write without a key holds the snapshot text and is 0600; a secret write leaves no backup', async () => {
		const file = path.join(home, 'mcp.json');

		fs.writeFileSync(file, 'snapshot text');
		const s = snap(file);

		expect(await writeFileSafe(env, file, 'new text', { snapshot: s, secret: false })).toMatchObject({ ok: true });
		expect(fs.readFileSync(file + BACKUP_SUFFIX, 'utf8')).toBe('snapshot text');

		const other = path.join(home, 'secret.json');

		fs.writeFileSync(other, 'old key');
		expect(await writeFileSafe(env, other, 'new key', { snapshot: snap(other), secret: true })).toMatchObject({ ok: true });
		expect(fs.existsSync(other + BACKUP_SUFFIX)).toBe(false);
		if (posix) {
			expect(modeOf(file + BACKUP_SUFFIX)).toBe(0o600);
		};
		expect(leftovers(home)).toEqual([]);
	});

	testLink('a link at the backup path is refused and nothing is written', async () => {
		const file = path.join(home, 'mcp.json');
		const elsewhere = path.join(home, 'elsewhere');

		fs.writeFileSync(file, 'original');
		fs.writeFileSync(elsewhere, 'untouched');
		fs.symlinkSync(elsewhere, file + BACKUP_SUFFIX);

		expect(await writeFileSafe(env, file, 'new', { snapshot: snap(file), secret: false })).toMatchObject({ ok: false, error: { stage: 'write', category: 'permission' } });
		expect(fs.readFileSync(file, 'utf8')).toBe('original');
		expect(fs.readFileSync(elsewhere, 'utf8')).toBe('untouched');
		expect(leftovers(home)).toEqual([]);
	});

	test('a change after the temp file is written and before the rename → changed, nothing written', async () => {
		const file = path.join(home, 'mcp.json');

		fs.writeFileSync(file, 'v1');

		const s = snap(file);
		const hooked: Env = {
			...env,
			writeFile: (p, text, mode) => {
				const temp = env.writeFile(p, text, mode);

				if (p.includes('.new-')) {
					fs.writeFileSync(file, 'edited by the app');
				};
				return temp;
			},
		};

		expect(await writeFileSafe(hooked, file, 'ours', { snapshot: s, secret: true })).toEqual({ ok: false, changed: true });
		expect(fs.readFileSync(file, 'utf8')).toBe('edited by the app');
		expect(leftovers(home)).toEqual([]);
	});

	test('a file created after a missing-file snapshot → changed', async () => {
		const file = path.join(home, 'mcp.json');
		const s = snap(file);

		fs.writeFileSync(file, 'appeared');
		expect(await writeFileSafe(env, file, 'ours', { snapshot: s, secret: true })).toEqual({ ok: false, changed: true });
		expect(fs.readFileSync(file, 'utf8')).toBe('appeared');
	});

	testLink('a symlinked target is written through and the link kept', async () => {
		fs.mkdirSync(path.join(home, 'dotfiles'));
		fs.mkdirSync(path.join(home, '.cursor'));

		const real = path.join(home, 'dotfiles', 'mcp.json');
		const link = path.join(home, '.cursor', 'mcp.json');

		fs.writeFileSync(real, '{}');
		fs.symlinkSync(real, link);

		const target = resolved(link);

		expect(await writeFileSafe(env, target, '{"a":1}', { snapshot: snap(target), secret: true })).toMatchObject({ ok: true });
		expect(fs.lstatSync(link).isSymbolicLink()).toBe(true);
		expect(fs.readFileSync(link, 'utf8')).toBe('{"a":1}');
		expect(fs.existsSync(real + BACKUP_SUFFIX)).toBe(false);
	});

	test('the temp file is removed when the rename fails', async () => {
		const file = path.join(home, 'mcp.json');

		fs.writeFileSync(file, 'v1');

		const failing: Env = { ...env, rename: (from, to) => {
			if (to == file) {
				throw Object.assign(new Error('nope'), { code: 'EIO' });
			};
			env.rename(from, to);
		} };

		expect(await writeFileSafe(failing, file, 'v2', { snapshot: snap(file), secret: true })).toMatchObject({ ok: false, error: { stage: 'write', category: 'unknown' } });
		expect(fs.readFileSync(file, 'utf8')).toBe('v1');
		expect(leftovers(home)).toEqual([]);
	});

	test('bytes that are not valid UTF-8 are unparseable: never edited, never backed up', async () => {
		const file = path.join(home, 'mcp.json');
		// A legacy-encoded "é" (0xE9) in an unrelated name
		const bytes = Buffer.concat([ Buffer.from('{"name":"Andr'), Buffer.from([ 0xE9 ]), Buffer.from('","mcpServers":{}}') ]);

		fs.writeFileSync(file, bytes);
		expect(readSnapshot(env, file)).toEqual({ error: { stage: 'parse', category: 'unparseable', path: file } });
		expect(fs.readFileSync(file).equals(bytes)).toBe(true);
		expect(fs.existsSync(file + BACKUP_SUFFIX)).toBe(false);

		// Valid UTF-8 with a BOM is fine and round-trips exactly
		const bom = Buffer.concat([ Buffer.from([ 0xEF, 0xBB, 0xBF ]), Buffer.from('{"name":"André"}') ]);

		fs.writeFileSync(file, bom);
		expect(await writeFileSafe(env, file, '{}', { snapshot: snap(file), secret: false })).toMatchObject({ ok: true });
		expect(fs.readFileSync(file + BACKUP_SUFFIX).equals(bom)).toBe(true);
	});

	test('an existing file that can not be read is never treated as missing', () => {
		const unreadable: Env = { ...env, readFile: () => ({ error: 'io' }) };
		const file = path.join(home, 'mcp.json');

		fs.writeFileSync(file, 'x');
		expect(readSnapshot(unreadable, file)).toMatchObject({ error: { category: 'permission' } });
	});
});

describe('writeFileSafe on Windows', () => {
	const winHome = 'C:\\Users\\me';
	const file = 'C:\\Users\\me\\.cursor\\mcp.json';

	test('a busy target is rechecked before every retry, at most three retries', async () => {
		const env = fakeEnv({ platform: 'win32', home: winHome, files: { [file]: '{}' } });
		const s = readSnapshot(env, file) as Snapshot;
		const events: string[] = [];
		const read = env.readFile;
		const rename = env.rename;
		let busy = 2;

		env.readFile = (p, max) => {
			if (p == file) {
				events.push('recheck');
			};
			return read(p, max);
		};
		env.rename = (from, to) => {
			if ((to == file) && (busy-- > 0)) {
				events.push('busy');
				throw Object.assign(new Error('busy'), { code: 'EBUSY' });
			};
			if (to == file) {
				events.push('rename');
			};
			rename(from, to);
		};

		expect(await writeFileSafe(env, file, '{"a":1}', { snapshot: s, secret: true })).toMatchObject({ ok: true });
		expect(events).toEqual([ 'recheck', 'busy', 'recheck', 'busy', 'recheck', 'rename' ]);
		expect(env.files()[file]).toBe('{"a":1}');
	});

	test('still busy after three retries → error, target untouched, temp removed', async () => {
		const env = fakeEnv({ platform: 'win32', home: winHome, files: { [file]: '{}' } });
		const s = readSnapshot(env, file) as Snapshot;
		const rename = env.rename;
		let attempts = 0;

		env.rename = (from, to) => {
			if (to == file) {
				attempts++;
				throw Object.assign(new Error('perm'), { code: 'EPERM' });
			};
			rename(from, to);
		};

		expect(await writeFileSafe(env, file, '{"a":1}', { snapshot: s, secret: true })).toMatchObject({ ok: false, error: { stage: 'write' } });
		expect(attempts).toBe(4);
		expect(Object.keys(env.files()).sort()).toEqual([ file ]);
		expect(env.files()[file]).toBe('{}');
	});

	test('a busy rename on macOS / Linux is not retried', async () => {
		const env = fakeEnv({ platform: 'darwin', home: '/Users/me', files: { '/Users/me/.cursor/mcp.json': '{}' } });
		const target = '/Users/me/.cursor/mcp.json';
		const s = readSnapshot(env, target) as Snapshot;
		const rename = env.rename;
		let attempts = 0;

		env.rename = (from, to) => {
			if (to == target) {
				attempts++;
				throw Object.assign(new Error('busy'), { code: 'EBUSY' });
			};
			rename(from, to);
		};

		expect(await writeFileSafe(env, target, '{"a":1}', { snapshot: s, secret: true })).toMatchObject({ ok: false });
		expect(attempts).toBe(1);
	});
});

describe('writeFileSafe: the parent directory is rechecked', () => {
	testLink('a parent swapped for a link after the snapshot → changed, nothing written outside', async () => {
		const outside = tempDir('aic-out-');

		try {
			fs.mkdirSync(path.join(home, '.cursor'));

			const target = resolved(path.join(home, '.cursor', 'mcp.json'));
			const s = snap(target);

			// The planned directory becomes a link to somewhere outside home
			fs.rmdirSync(path.join(home, '.cursor'));
			fs.symlinkSync(outside, path.join(home, '.cursor'));

			expect(await writeFileSafe(env, target, '{"key":"x"}', { snapshot: s, secret: true })).toEqual({ ok: false, changed: true });
			expect(fs.readdirSync(outside)).toEqual([]);
		} finally {
			fs.rmSync(outside, { recursive: true, force: true });
		};
	});

	/**
	 * Writes SECRET into an existing ~/.cursor/mcp.json (so a backup is made too) while `swap` moves
	 * ~/.cursor to ~/.cursor-moved and puts a link to a directory outside home in its place, at the
	 * moment `when` says. The write must report `changed`, and neither directory may keep the secret.
	 */
	const swapDuring = async (when: (call: { op: string; p: string; to?: string }) => boolean, secret = true) => {
		const outside = tempDir('aic-out-');
		const cursor = path.join(home, '.cursor');
		const moved = path.join(home, '.cursor-moved');
		let swapped = false;

		try {
			fs.mkdirSync(cursor);
			fs.writeFileSync(path.join(cursor, 'mcp.json'), '{"old":"OLD-KEY"}');

			const target = resolved(path.join(cursor, 'mcp.json'));
			const s = snap(target);
			const swap = (call: { op: string; p: string; to?: string }) => {
				if (!swapped && when(call)) {
					swapped = true;
					fs.renameSync(cursor, moved);
					fs.symlinkSync(outside, cursor);
				};
			};
			const hooked: Env = {
				...env,
				lstat: p => {
					swap({ op: 'lstat', p });
					return env.lstat(p);
				},
				chmod: (p, mode) => {
					env.chmod(p, mode);
					swap({ op: 'chmod', p });
				},
				rename: (from, to) => {
					env.rename(from, to);
					swap({ op: 'rename', p: from, to });
				},
			};

			const res = await writeFileSafe(hooked, target, `{"key":"${SECRET}"}`, { snapshot: s, secret });

			expect(swapped).toBe(true);
			expect(res).toEqual({ ok: false, changed: true });
			expect(fs.readdirSync(outside)).toEqual([]);
			// The moved directory keeps the user's file untouched and no copy of the new secret
			expect(holding(moved, SECRET)).toEqual([]);
			expect(fs.readFileSync(path.join(moved, 'mcp.json'), 'utf8')).toBe('{"old":"OLD-KEY"}');
			return { moved };
		} finally {
			fs.rmSync(outside, { recursive: true, force: true });
		};
	};

	testLink('swapped right before the backup temp is created → changed, no temp anywhere', async () => {
		const { moved } = await swapDuring(c => (c.op == 'lstat') && c.p.endsWith(BACKUP_SUFFIX), false);

		expect(leftovers(moved)).toEqual([]);
	});

	testLink('swapped after the backup temp is written, before its rename → changed, the stranded backup temp is emptied', async () => {
		const { moved } = await swapDuring(c => (c.op == 'chmod') && c.p.includes('.backup-'), false);

		expect(holding(moved, 'OLD-KEY').map(p => path.basename(p))).toEqual([ 'mcp.json' ]);
		expect(leftovers(moved).every(n => fs.statSync(path.join(moved, n)).size == 0)).toBe(true);
	});

	testLink('swapped after the backup is published, before the new temp is created → changed, no secret temp', async () => {
		const { moved } = await swapDuring(c => (c.op == 'rename') && !!c.to?.endsWith(BACKUP_SUFFIX), false);

		expect(leftovers(moved)).toEqual([]);
		expect(fs.readFileSync(path.join(moved, 'mcp.json' + BACKUP_SUFFIX), 'utf8')).toBe('{"old":"OLD-KEY"}');
	});

	testLink('swapped after the new temp is written, before the rename → changed, the stranded secret temp is emptied', async () => {
		const { moved } = await swapDuring(c => (c.op == 'chmod') && c.p.includes('.new-'));

		// It can't be unlinked through the old path any more; its content is gone
		expect(leftovers(moved).length).toBe(1);
		expect(fs.statSync(path.join(moved, leftovers(moved)[0])).size).toBe(0);
	});

	testLink('a link at the nearest existing ancestor: nothing is created through it', async () => {
		const outside = tempDir('aic-out-');

		try {
			fs.symlinkSync(outside, path.join(home, 'a'));
			expect(await writeFileSafe(env, path.join(home, 'a', 'b', 'mcp.json'), SECRET, { snapshot: { text: null, mode: null, id: null }, secret: true })).toEqual({ ok: false, changed: true });
			expect(fs.readdirSync(outside)).toEqual([]);
		} finally {
			fs.rmSync(outside, { recursive: true, force: true });
		};
	});
});

describe('writeFileSafe: directories created by a failed attempt are removed', () => {
	test('a failed rename removes the new .cursor, so it can not count as install evidence', async () => {
		const target = resolved(path.join(home, '.cursor', 'mcp.json'));
		const failing: Env = { ...env, rename: (from, to) => {
			if (to == target) {
				throw Object.assign(new Error('nospace'), { code: 'ENOSPC' });
			};
			env.rename(from, to);
		} };

		expect(await writeFileSafe(failing, target, '{}', { snapshot: snap(target), secret: true })).toMatchObject({ ok: false, error: { stage: 'write' } });
		expect(fs.existsSync(path.join(home, '.cursor'))).toBe(false);
	});

	test('a changed result removes them too; a directory someone filled meanwhile stays', async () => {
		const target = resolved(path.join(home, 'a', 'b', 'mcp.json'));
		const s = snap(target);
		const hooked: Env = {
			...env,
			writeFile: (p, text, mode) => {
				const temp = env.writeFile(p, text, mode);

				if (p.includes('.new-')) {
					fs.writeFileSync(path.join(home, 'a', 'users-file'), 'mine');
					fs.writeFileSync(target, 'appeared');
				};
				return temp;
			},
		};

		expect(await writeFileSafe(hooked, target, '{}', { snapshot: s, secret: true })).toEqual({ ok: false, changed: true });
		// b holds the file that appeared, a holds the user's file: both stay
		expect(fs.existsSync(path.join(home, 'a', 'b'))).toBe(true);
		expect(fs.readFileSync(path.join(home, 'a', 'users-file'), 'utf8')).toBe('mine');
	});

	test('a mkdir failing part-way removes the level it did create', async () => {
		const target = path.join(home, 'a', 'b', 'mcp.json');
		const failing: Env = { ...env, mkdir: (p, mode) => {
			if (p.endsWith(path.join('a', 'b'))) {
				throw Object.assign(new Error('denied'), { code: 'EACCES' });
			};
			env.mkdir(p, mode);
		} };

		expect(await writeFileSafe(failing, target, '{}', { snapshot: { text: null, mode: null, id: null }, secret: true })).toMatchObject({ ok: false, error: { category: 'permission' } });
		expect(fs.existsSync(path.join(home, 'a'))).toBe(false);
	});
});

describe('complete writes and bounded reads', () => {
	test('Env.writeFile writes all of a large text and keeps the descriptor until close', () => {
		const file = path.join(home, 'big.json');
		const text = 'x'.repeat(3 * 1024 * 1024 + 7);
		const temp = env.writeFile(file, text, 0o600);

		expect(fs.statSync(file).size).toBe(text.length);
		expect(temp.ino).toBe(fs.statSync(file).ino);

		// The descriptor still reaches the file after it was moved away
		fs.renameSync(file, path.join(home, 'moved.json'));
		temp.wipe();
		temp.close();
		temp.close();
		expect(fs.statSync(path.join(home, 'moved.json')).size).toBe(0);
	});

	testLink('Env.writeFile never writes through a link (exclusive create)', () => {
		fs.writeFileSync(path.join(home, 'victim'), 'precious');
		fs.symlinkSync(path.join(home, 'victim'), path.join(home, 'link'));

		expect(() => env.writeFile(path.join(home, 'link'), SECRET, 0o600)).toThrow(/EEXIST/);
		expect(fs.readFileSync(path.join(home, 'victim'), 'utf8')).toBe('precious');
	});

	test('a write that fails part-way never reaches the rename', async () => {
		const file = path.join(home, 'mcp.json');

		fs.writeFileSync(file, 'v1');

		const spy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {
			throw Object.assign(new Error('no space'), { code: 'ENOSPC' });
		});

		try {
			expect(await writeFileSafe(env, file, 'v2-long-content', { snapshot: snap(file), secret: true })).toMatchObject({ ok: false, error: { stage: 'write' } });
		} finally {
			spy.mockRestore();
		};

		expect(fs.readFileSync(file, 'utf8')).toBe('v1');
		expect(leftovers(home)).toEqual([]);
	});

	itPosix('a FIFO is never read (no hang) and never edited', () => {
		const fifo = path.join(home, 'mcp.json');

		execFileSync('mkfifo', [ fifo ]);
		expect(readSnapshot(env, fifo)).toMatchObject({ error: { stage: 'read', category: 'unsupportedForm' } });
		expect(env.readText(fifo)).toBeNull();
	});

	test('a config above the size cap is not edited; a directory is not a file', () => {
		const file = path.join(home, 'huge.json');

		fs.writeFileSync(file, Buffer.alloc(MAX_CONFIG_BYTES + 1, 32));
		expect(readSnapshot(env, file)).toMatchObject({ error: { category: 'unsupportedForm' } });
		expect(readSnapshot(env, home)).toMatchObject({ error: { category: 'unsupportedForm' } });
		expect(env.readFile(path.join(home, 'nope'), 10)).toEqual({ error: 'missing' });
	});
});

describe('UNC and device paths', () => {
	const win = fakeEnv({ platform: 'win32', home: 'C:\\Users\\me' });

	test.each([
		'\\\\server\\share\\x.json',
		'//server/share/x.json',
		'\\\\?\\C:\\x.json',
		'\\\\.\\pipe\\x',
	])('%s is refused before any lookup', p => {
		const lstat = vi.spyOn(win, 'lstat');

		expect(isLocalAbsolute(win, p)).toBe(false);
		expect(canonicalPath(win, p)).toBeNull();
		expect(lstat).not.toHaveBeenCalled();
		lstat.mockRestore();
	});

	test('local absolute paths pass', () => {
		expect(isLocalAbsolute(win, 'C:\\Users\\me\\.codex')).toBe(true);
		expect(isLocalAbsolute(win, 'relative\\x')).toBe(false);
		expect(isLocalAbsolute(fakeEnv({ platform: 'darwin', home: '/Users/me' }), '/Users/me/x')).toBe(true);
	});
});
