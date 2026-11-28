import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { MAX_BYTES, Registry } from './registry';
import { validateParam } from './validate';
import { modeOf, nodeEnv, tempDir } from './testEnv';
import type { AiRecord, Env } from './types';

let dir = '';
let env: Env;
let file = '';

beforeEach(() => {
	dir = tempDir('aic-reg-');
	env = nodeEnv(dir);
	file = path.join(dir, 'aiConnect.json');
});

afterEach(() => {
	fs.rmSync(dir, { recursive: true, force: true });
});

const record = (over: Partial<AiRecord> = {}): AiRecord => ({
	id: 'cursor',
	appId: 'cursor',
	accountId: 'acc-a',
	appHash: 'hash-1',
	keyFp: '0123456789abcdef',
	name: 'Cursor',
	route: 'http',
	tier: 'large',
	recommendedTier: 'large',
	method: 'config',
	targetPath: '/home/me/.cursor/mcp.json',
	port: 31009,
	createdAt: 1,
	grant: { spaceIds: [], allSpaces: true, perm: 1 },
	expireAt: 0,
	nextStep: 'restart',
	observedInstalled: false,
	lastProbe: 'none',
	revokePending: [],
	removed: false,
	createdDirs: [],
	...over,
});

describe('Registry', () => {
	test('a missing file is an empty registry; writes are 0600 JSON', () => {
		const reg = new Registry(env, file);

		expect(reg.list('acc-a')).toEqual([]);
		reg.upsert(record());

		expect(JSON.parse(fs.readFileSync(file, 'utf8'))).toEqual({ version: 1, nudgeClaimed: false, connections: [ record() ], orphanHashes: [] });
		if (process.platform != 'win32') {
			expect(modeOf(file)).toBe(0o600);
		};
		expect(fs.readdirSync(dir)).toEqual([ 'aiConnect.json' ]);
	});

	test('per-account isolation', () => {
		const reg = new Registry(env, file);

		reg.upsert(record({ accountId: 'acc-a' }));
		reg.upsert(record({ accountId: 'acc-b', appHash: 'hash-b' }));

		expect(reg.list('acc-a').map(it => it.appHash)).toEqual([ 'hash-1' ]);
		expect(reg.list('acc-b').map(it => it.appHash)).toEqual([ 'hash-b' ]);
		expect(reg.get('acc-a', 'cursor').appHash).toBe('hash-1');
		expect(reg.get('acc-c', 'cursor')).toBeNull();

		reg.remove('acc-a', 'cursor');
		expect(reg.list('acc-a')).toEqual([]);
		expect(reg.list('acc-b')).toHaveLength(1);
	});

	test('upsert replaces by account + id; patch merges and keeps the identity', () => {
		const reg = new Registry(env, file);

		reg.upsert(record());
		reg.upsert(record({ appHash: 'hash-2' }));
		expect(reg.list('acc-a')).toHaveLength(1);

		const patched = reg.patch('acc-a', 'cursor', { nextStep: 'none', lastProbe: 'ok', id: 'other-x' as any, accountId: 'acc-z' });

		expect(patched).toMatchObject({ id: 'cursor', accountId: 'acc-a', appHash: 'hash-2', nextStep: 'none', lastProbe: 'ok' });
		expect(new Registry(env, file).get('acc-a', 'cursor')).toMatchObject({ nextStep: 'none', lastProbe: 'ok' });
		expect(reg.patch('acc-a', 'missing', { nextStep: 'none' })).toBeNull();
	});

	test('returned records are copies', () => {
		const reg = new Registry(env, file);

		reg.upsert(record());
		reg.get('acc-a', 'cursor').revokePending.push('x');
		expect(reg.get('acc-a', 'cursor').revokePending).toEqual([]);
	});

	test('claimNudge is true exactly once, also across instances', () => {
		const reg = new Registry(env, file);

		expect(reg.claimNudge()).toBe(true);
		expect(reg.claimNudge()).toBe(false);
		expect(new Registry(env, file).claimNudge()).toBe(false);
	});

	test.each([
		[ 'broken JSON', '{ nope' ],
		[ 'a wrong version', JSON.stringify({ version: 2, nudgeClaimed: true, connections: [] }) ],
		[ 'a wrong shape', JSON.stringify({ version: 1, nudgeClaimed: false, connections: [ 1 ] }) ],
		[ 'an incomplete row', JSON.stringify({ version: 1, nudgeClaimed: false, connections: [ { id: 'cursor', accountId: 'acc-a', removed: true } ] }) ],
		[ 'a row with a wrong array element', JSON.stringify({ version: 1, nudgeClaimed: false, connections: [ { ...record(), revokePending: [ 1 ] } ] }) ],
		[ 'bad orphans', JSON.stringify({ version: 1, nudgeClaimed: false, connections: [], orphanHashes: [ { accountId: 'a' } ] }) ],
		// Hashes reconciliation (aiConnectCheck) would reject: one of them would block every check of the account
		[ 'an empty pending hash', JSON.stringify({ version: 1, nudgeClaimed: false, connections: [ { ...record(), revokePending: [ '' ] } ] }) ],
		[ 'a pending hash with a space', JSON.stringify({ version: 1, nudgeClaimed: false, connections: [ { ...record(), revokePending: [ 'a b' ] } ] }) ],
		[ 'an appHash with a quote', JSON.stringify({ version: 1, nudgeClaimed: false, connections: [ record({ appHash: 'h"1' }) ] }) ],
		[ 'an orphan hash too long', JSON.stringify({ version: 1, nudgeClaimed: false, connections: [], orphanHashes: [ { accountId: 'a', hash: 'h'.repeat(257) } ] }) ],
	])('%s is quarantined first, then the registry starts empty', (_, text) => {
		fs.writeFileSync(file, text);

		const reg = new Registry(env, file);

		expect(reg.list('acc-a')).toEqual([]);
		expect(fs.readFileSync(file + '.broken', 'utf8')).toBe(text);
		expect(fs.existsSync(file)).toBe(false);
		expect(reg.claimNudge()).toBe(true);
		expect(JSON.parse(fs.readFileSync(file, 'utf8'))).toEqual({ version: 1, nudgeClaimed: true, connections: [], orphanHashes: [] });
	});
});

describe('Registry never loses records', () => {
	test('a read error other than ENOENT throws, writes nothing, and the next call retries', () => {
		new Registry(env, file).upsert(record());

		const original = fs.readFileSync(file, 'utf8');
		let fail = true;
		const flaky: Env = { ...env, readFile: (p, max) => fail ? { error: 'io' } : env.readFile(p, max) };
		const reg = new Registry(flaky, file);

		expect(() => reg.list('acc-a')).toThrow();
		expect(() => reg.claimNudge()).toThrow();
		expect(fs.readFileSync(file, 'utf8')).toBe(original);

		fail = false;
		expect(reg.list('acc-a')).toHaveLength(1);
		expect(reg.claimNudge()).toBe(true);
		expect(new Registry(env, file).list('acc-a')).toHaveLength(1);
	});

	test('a corrupt file that can not be moved aside stays as it is', () => {
		fs.writeFileSync(file, '{ corrupt');

		const stuck: Env = { ...env, rename: () => {
			throw Object.assign(new Error('busy'), { code: 'EBUSY' });
		} };
		const reg = new Registry(stuck, file);

		expect(() => reg.claimNudge()).toThrow();
		expect(fs.readFileSync(file, 'utf8')).toBe('{ corrupt');
		expect(fs.existsSync(file + '.broken')).toBe(false);
	});

	test('a failed save is not visible afterwards: the same instance retries cleanly', () => {
		let fail = true;
		const flaky: Env = { ...env, rename: (from, to) => {
			if (fail && (to == file)) {
				throw Object.assign(new Error('nospace'), { code: 'ENOSPC' });
			};
			env.rename(from, to);
		} };
		const reg = new Registry(flaky, file);

		expect(() => reg.claimNudge()).toThrow();
		expect(() => reg.upsert(record())).toThrow();
		expect(() => reg.addOrphan('acc-a', 'h-1')).toThrow();
		expect(reg.list('acc-a')).toEqual([]);
		expect(reg.listOrphans('acc-a')).toEqual([]);
		expect(fs.existsSync(file)).toBe(false);
		expect(fs.readdirSync(dir).filter(n => n.endsWith('.tmp'))).toEqual([]);

		fail = false;
		expect(reg.claimNudge()).toBe(true);
		expect(reg.claimNudge()).toBe(false);
	});

	test('an invalid record is refused, nothing written', () => {
		const reg = new Registry(env, file);

		expect(() => reg.upsert({ ...record(), revokePending: undefined } as any)).toThrow();
		reg.upsert(record());
		expect(() => reg.patch('acc-a', 'cursor', { tier: 'huge' as any })).toThrow();
		expect(reg.get('acc-a', 'cursor').tier).toBe('large');
	});
});

describe('Registry read failures and size', () => {
	test('ENOTDIR (the profile path is temporarily a file) is an error, not a fresh registry; the same instance recovers', () => {
		const profile = path.join(dir, 'profile');
		const reg0 = new Registry(env, path.join(profile, 'aiConnect.json'));

		fs.mkdirSync(profile);
		reg0.upsert(record({ revokePending: [ 'h-pending' ] }));
		reg0.addOrphan('acc-a', 'h-orphan');

		// The profile folder is replaced by a file for a while (a restore in progress, a sync tool, …)
		fs.renameSync(profile, profile + '.away');
		fs.writeFileSync(profile, 'not a directory');

		const reg = new Registry(env, path.join(profile, 'aiConnect.json'));

		expect(env.readFile(path.join(profile, 'aiConnect.json'), 1024)).toEqual({ error: 'io' });
		expect(() => reg.listOrphans('acc-a')).toThrow();
		expect(() => reg.addOrphan('acc-a', 'h-new')).toThrow();
		expect(() => reg.claimNudge()).toThrow();

		fs.rmSync(profile);
		fs.renameSync(profile + '.away', profile);

		// Nothing was cached or written meanwhile: the outstanding hashes are all still there
		reg.addOrphan('acc-a', 'h-new');
		expect(reg.listOrphans('acc-a')).toEqual([ 'h-orphan', 'h-new' ]);
		expect(reg.get('acc-a', 'cursor').revokePending).toEqual([ 'h-pending' ]);
		expect(new Registry(env, path.join(profile, 'aiConnect.json')).listOrphans('acc-a')).toEqual([ 'h-orphan', 'h-new' ]);
	});

	test('a valid registry above the read cap is an error: not quarantined, not replaced by an empty one', () => {
		const small = 4096;
		const text = JSON.stringify({ version: 1, nudgeClaimed: false, connections: [], orphanHashes: [ { accountId: 'acc-a', hash: 'h-1' } ] }) + ' '.repeat(small);

		fs.writeFileSync(file, text);

		const reg = new Registry(env, file, small);

		expect(() => reg.listOrphans('acc-a')).toThrow();
		expect(() => reg.claimNudge()).toThrow();
		expect(fs.readFileSync(file, 'utf8')).toBe(text);
		expect(fs.existsSync(file + '.broken')).toBe(false);
		// Read with the production cap it is a normal registry
		expect(new Registry(env, file).listOrphans('acc-a')).toEqual([ 'h-1' ]);
		expect(MAX_BYTES).toBe(64 * 1024 * 1024);
	});

	test('a candidate above the cap is never saved, so the next start can always read what was written', () => {
		const reg = new Registry(env, file, 2048);

		reg.upsert(record());
		expect(() => reg.upsert(record({ id: 'copilot', createdDirs: [ 'x'.repeat(4096) ] }))).toThrow();
		expect(reg.list('acc-a')).toHaveLength(1);
		expect(new Registry(env, file, 2048).list('acc-a')).toHaveLength(1);
	});

	test('every hash the registry accepts is one reconciliation accepts', () => {
		const reg = new Registry(env, file);

		expect(() => reg.addOrphan('acc-a', '')).toThrow();
		expect(() => reg.addOrphan('acc-a', 'a b')).toThrow();
		expect(() => reg.upsert(record({ revokePending: [ '' ] }))).toThrow();
		expect(() => reg.upsert(record({ appHash: '' }))).toThrow();

		reg.upsert(record({ appHash: 'Qm+/=_.:-0', revokePending: [ 'h-1' ] }));
		reg.addOrphan('acc-a', 'h-2');

		const keys = [ ...reg.list('acc-a').flatMap(r => [ r.appHash, ...r.revokePending ]), ...reg.listOrphans('acc-a') ].map(hash => ({ hash, present: false }));

		expect(validateParam('aiConnectCheck', { accountId: 'acc-a', apiListening: false, keys })).not.toBeNull();
	});

	test('a registry directory replaced while the temp is staged → the save throws, nothing lands in the new directory', () => {
		const profile = path.join(dir, 'profile');
		let swapped = false;

		fs.mkdirSync(profile);

		const hooked: Env = {
			...env,
			chmod: (p, mode) => {
				env.chmod(p, mode);
				if (!swapped && p.endsWith('.tmp')) {
					swapped = true;
					fs.renameSync(profile, profile + '.moved');
					fs.mkdirSync(profile);
				};
			},
		};
		const reg = new Registry(hooked, path.join(profile, 'aiConnect.json'));

		expect(() => reg.claimNudge()).toThrow();
		expect(swapped).toBe(true);
		expect(fs.readdirSync(profile)).toEqual([]);
		// The stranded temp was emptied through its descriptor
		expect(fs.readdirSync(profile + '.moved').every(n => fs.statSync(path.join(profile + '.moved', n)).size == 0)).toBe(true);
	});
});

describe('Registry: a profile that is not there yet, or a file that appears later', () => {
	/** What another Anytype instance (or a restore) puts on disk: one record with a pending revoke, one orphan */
	const onDisk = (registryFile: string) => {
		fs.mkdirSync(path.dirname(registryFile), { recursive: true });
		fs.writeFileSync(registryFile, JSON.stringify({ version: 1, nudgeClaimed: false, connections: [ record({ revokePending: [ 'pending-from-disk' ] }) ], orphanHashes: [ { accountId: 'acc-a', hash: 'orphan-from-disk' } ] }));
	};

	test('a missing profile directory is a read error; once it is back, nothing on disk is lost', () => {
		const registryFile = path.join(dir, 'profile', 'aiConnect.json');
		const reg = new Registry(env, registryFile);

		expect(() => reg.listOrphans('acc-a')).toThrow();
		expect(() => reg.addOrphan('acc-a', 'new-pending')).toThrow();
		expect(() => reg.claimNudge()).toThrow();
		expect(fs.existsSync(path.dirname(registryFile))).toBe(false);

		onDisk(registryFile);
		reg.addOrphan('acc-a', 'new-pending');

		const fresh = new Registry(env, registryFile);

		expect(fresh.listOrphans('acc-a')).toEqual([ 'orphan-from-disk', 'new-pending' ]);
		expect(fresh.get('acc-a', 'cursor').revokePending).toEqual([ 'pending-from-disk' ]);
	});

	test('a profile directory that can not be listed is a read error too', () => {
		const unlistable: Env = { ...env, readDir: () => null };

		expect(() => new Registry(unlistable, file).list('acc-a')).toThrow();
	});

	test('started empty, then another instance writes the file: the first save loads it instead of overwriting', () => {
		const reg = new Registry(env, file);

		expect(reg.listOrphans('acc-a')).toEqual([]);
		onDisk(file);

		expect(reg.claimNudge()).toBe(true);

		const fresh = new Registry(env, file);

		expect(fresh.listOrphans('acc-a')).toEqual([ 'orphan-from-disk' ]);
		expect(fresh.get('acc-a', 'cursor').revokePending).toEqual([ 'pending-from-disk' ]);
		expect(fresh.claimNudge()).toBe(false);
	});

	test('the file appears while the first save is staged: the save is redone on top of it', () => {
		let appeared = false;
		const hooked: Env = {
			...env,
			chmod: (p, mode) => {
				env.chmod(p, mode);
				if (!appeared && p.endsWith('.tmp')) {
					appeared = true;
					onDisk(file);
				};
			},
		};
		const reg = new Registry(hooked, file);

		reg.addOrphan('acc-a', 'mine');

		expect(appeared).toBe(true);
		expect(new Registry(env, file).listOrphans('acc-a')).toEqual([ 'orphan-from-disk', 'mine' ]);
		expect(new Registry(env, file).get('acc-a', 'cursor').revokePending).toEqual([ 'pending-from-disk' ]);
		expect(fs.readdirSync(dir).filter(n => n.endsWith('.tmp'))).toEqual([]);
	});
});

describe('Registry orphan hashes', () => {
	test('add / remove per account, a set, persisted', () => {
		const reg = new Registry(env, file);

		reg.addOrphan('acc-a', 'h-1');
		reg.addOrphan('acc-a', 'h-1');
		reg.addOrphan('acc-a', 'h-2');
		reg.addOrphan('acc-b', 'h-1');

		expect(reg.listOrphans('acc-a')).toEqual([ 'h-1', 'h-2' ]);
		expect(reg.listOrphans('acc-b')).toEqual([ 'h-1' ]);

		reg.removeOrphan('acc-a', 'h-1');
		expect(reg.listOrphans('acc-a')).toEqual([ 'h-2' ]);
		expect(new Registry(env, file).listOrphans('acc-b')).toEqual([ 'h-1' ]);
		expect(new Registry(env, file).listOrphans('acc-c')).toEqual([]);
	});

	test('a file without orphanHashes loads with none', () => {
		fs.writeFileSync(file, JSON.stringify({ version: 1, nudgeClaimed: false, connections: [ record() ] }));

		const reg = new Registry(env, file);

		expect(reg.listOrphans('acc-a')).toEqual([]);
		expect(reg.list('acc-a')).toHaveLength(1);
		expect(fs.existsSync(file + '.broken')).toBe(false);
	});
});
