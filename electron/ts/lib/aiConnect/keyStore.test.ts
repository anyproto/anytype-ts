/**
 * keyStore.ts against a fake forwarder executable: a script in a temp folder that records its argv, its
 * stdin and its environment, and answers with the exit code and the one JSON line the test scripted
 * (anytype-mcp-plan §2.7, §2.8, §13). The real Env starts it, as main does.
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { keyCheck, keyDelete, keyRetarget, keySet, keyStoreConfig, stampOf } from './keyStore';
import { keyFingerprint } from './digest';
import { nodeEnv, tempDir } from './testEnv';
import type { Env } from './types';

const KEY = 'SENTINEL-keystore-0123456789abcdef';
const FP = keyFingerprint(KEY);
const STAMP = stampOf(FP, 3);

/** Records the call, then prints `stdout` and exits with `code` (both from answer.json); `hang` sleeps past any deadline */
const STUB = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const dir = path.dirname(process.argv[1]);
const answer = JSON.parse(fs.readFileSync(path.join(dir, 'answer.json'), 'utf8'));
let stdin = '';
process.stdin.on('data', d => stdin += d);
process.stdin.on('end', () => {
	// Q21: never the environment itself — only the two home variables and whether the key is anywhere in it
	const keyInEnv = Object.values(process.env).some(v => String(v).includes(${JSON.stringify(KEY)}));
	fs.appendFileSync(path.join(dir, 'calls.jsonl'), JSON.stringify({ argv: process.argv.slice(2), stdin, home: process.env.HOME, userprofile: process.env.USERPROFILE, keyInEnv, cwd: process.cwd() }) + '\\n');
	if (answer.kill) {
		// Q2: dies by a signal after doing its work, before any receipt
		process.kill(process.pid, 'SIGKILL');
		return;
	};
	if (answer.hang) {
		setTimeout(() => {}, 600000);
		return;
	};
	process.stdout.write(answer.stdout || '');
	process.exit(answer.code);
});
`;

let dir = '';
let env: Env = null;
let bin = '';

const sha = (buf: Buffer | string) => crypto.createHash('sha256').update(buf).digest('hex');

const answer = (code: number, value?: any, raw?: string, hang = false, kill = false) => {
	fs.writeFileSync(path.join(dir, 'app', 'dist', 'answer.json'), JSON.stringify({ code, hang, kill, stdout: (raw !== undefined) ? raw : ((value === undefined) ? '' : JSON.stringify(value) + '\n') }));
};

const calls = (): { argv: string[]; stdin: string; home: string; userprofile: string; keyInEnv: boolean; cwd: string }[] => {
	const file = path.join(dir, 'app', 'dist', 'calls.jsonl');
	return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim().split('\n').map(it => JSON.parse(it)) : [];
};

beforeEach(() => {
	dir = tempDir('aic-keystore-');
	fs.mkdirSync(path.join(dir, 'home'));
	fs.mkdirSync(path.join(dir, 'app', 'dist'), { recursive: true });
	bin = path.join(dir, 'app', 'dist', 'anytype-mcp');
	fs.writeFileSync(bin, STUB, { mode: 0o755 });

	// What the build wrote for the binary it shipped
	const meta = JSON.stringify({ signed: false, forwarder: { rev: 5, namespace: 'dev', sha256: { [(process.platform == 'darwin') ? 'darwin' : `${process.platform}-${process.arch}`]: sha(fs.readFileSync(bin)) } }, mcpb: null });

	env = nodeEnv(path.join(dir, 'home'), { appRoot: path.join(dir, 'app'), vars: { PATH: process.env.PATH }, buildMeta: () => meta });
	keyStoreConfig.timeout = 40 * 1000;
});

afterEach(() => {
	fs.rmSync(dir, { recursive: true, force: true });
});

// The stub is a script with a shebang: POSIX only (the Windows contract is the same JSON and exit codes)
describe.skipIf(process.platform == 'win32')('key verbs on a fake forwarder executable', () => {
	test('key set: the key is only on stdin — never in argv or the environment — and the child\'s home is the service\'s home', async () => {
		answer(0, { ok: true, fingerprint: FP, rev: 1 });

		expect(await keySet(env, 'claude-desktop', 'absent', { key: KEY, account: 'acc-a', port: 31012, tier: 'large' })).toEqual({ ok: true, fingerprint: FP, rev: 1 });

		const [ call ] = calls();

		expect(call.argv).toEqual([ 'key', 'set', '--connection', 'claude-desktop', '--expect', 'absent' ]);
		// Exactly one JSON object with the four members, nothing after it
		expect(JSON.parse(call.stdin)).toEqual({ key: KEY, account: 'acc-a', port: 31012, tier: 'large' });
		expect(Object.keys(JSON.parse(call.stdin))).toEqual([ 'key', 'account', 'port', 'tier' ]);
		expect(call.argv.join(' ')).not.toContain(KEY);
		expect(call.keyInEnv).toBe(false);
		expect(call.home).toBe(path.join(dir, 'home'));
		expect(call.userprofile).toBe(path.join(dir, 'home'));
		// Q21: the stub's record holds no environment at all
		expect(Object.keys(call).sort()).toEqual([ 'argv', 'cwd', 'home', 'keyInEnv', 'stdin', 'userprofile' ]);
		expect(fs.realpathSync(call.cwd)).toBe(fs.realpathSync(path.join(dir, 'home')));
	});

	test('key set with a stamp, retarget and delete pass the precondition and the owning account in argv; no stdin', async () => {
		answer(0, { ok: true, fingerprint: FP, rev: 4 });
		await keySet(env, 'other-1a2b3c4d', STAMP, { key: KEY, account: 'acc-a', port: 31012, tier: 'full' });
		expect(await keyRetarget(env, 'other-1a2b3c4d', STAMP, 'acc-a', { port: 31013, tier: 'small' })).toEqual({ ok: true, fingerprint: FP, rev: 4 });
		answer(0, { ok: true });
		expect(await keyDelete(env, 'other-1a2b3c4d', STAMP, 'acc-a')).toEqual({ ok: true });

		const [ set, retarget, del ] = calls();

		expect(set.argv).toEqual([ 'key', 'set', '--connection', 'other-1a2b3c4d', '--expect', STAMP ]);
		expect(retarget.argv).toEqual([ 'key', 'retarget', '--connection', 'other-1a2b3c4d', '--expect', STAMP, '--account', 'acc-a', '--port', '31013', '--tier', 'small' ]);
		expect(del.argv).toEqual([ 'key', 'delete', '--connection', 'other-1a2b3c4d', '--expect', STAMP, '--account', 'acc-a' ]);
		expect(retarget.stdin).toBe('');
		expect(del.stdin).toBe('');
	});

	test('key check: present, absent, invalid, and a store that couldn\'t say', async () => {
		answer(0, { present: true, fingerprint: FP, rev: 3, account: 'acc-a', port: 31012, tier: 'large', store: 'ok', kind: 'file', namespace: 'dev' });
		expect(await keyCheck(env, 'claude-desktop')).toEqual({ present: true, fingerprint: FP, rev: 3, account: 'acc-a', port: 31012, tier: 'large' });
		expect(calls()[0].argv).toEqual([ 'key', 'check', '--connection', 'claude-desktop' ]);

		answer(3, { present: false, store: 'ok', kind: 'file', namespace: 'dev' });
		expect(await keyCheck(env, 'claude-desktop')).toEqual({ present: false });

		answer(3, { present: false, invalid: true, store: 'ok', kind: 'file', namespace: 'dev' });
		expect(await keyCheck(env, 'claude-desktop')).toEqual({ present: false, invalid: true });

		answer(7, { present: null, store: 'denied', kind: 'file', namespace: 'dev' });
		expect(await keyCheck(env, 'claude-desktop')).toEqual({ present: null, error: { stage: 'write', category: 'storeDenied' } });

		answer(7, { present: null, store: 'unreachable', kind: 'file', namespace: 'dev' });
		expect(await keyCheck(env, 'claude-desktop')).toEqual({ present: null, error: { stage: 'write', category: 'unknown' } });

		// An answer that doesn't fit its exit code is never "present" and never "absent"
		answer(0, { present: true, fingerprint: 'nope', rev: 3, account: 'acc-a', port: 31012, tier: 'large' });
		expect(await keyCheck(env, 'claude-desktop')).toMatchObject({ present: null });
		answer(3, { present: true });
		expect(await keyCheck(env, 'claude-desktop')).toMatchObject({ present: null });
	});

	describe('every exit code of a mutating verb (§2.8)', () => {
		const set = () => keySet(env, 'claude-desktop', 'absent', { key: KEY, account: 'acc-a', port: 31012, tier: 'large' });
		const retarget = () => keyRetarget(env, 'claude-desktop', STAMP, 'acc-a', { port: 31013, tier: 'large' });
		const del = () => keyDelete(env, 'claude-desktop', STAMP, 'acc-a');

		test('0 with a receipt: ok', async () => {
			answer(0, { ok: true, fingerprint: FP, rev: 2 });
			expect(await set()).toEqual({ ok: true, fingerprint: FP, rev: 2 });
		});

		test('1 with `unconfirmed`: a lost receipt — reconcile with key check, never "nothing changed"', async () => {
			answer(1, { ok: false, unconfirmed: true, reason: 'the item read back differs' });
			for (const verb of [ set, retarget, del ]) {
				expect(await verb()).toEqual({ ok: false, unconfirmed: true });
			};
		});

		test('1 without a line (an internal error at any point): treated as unconfirmed too', async () => {
			answer(1, { ok: false, reason: 'internal error' });
			expect(await set()).toEqual({ ok: false, unconfirmed: true });
			answer(1);
			expect(await del()).toEqual({ ok: false, unconfirmed: true });
		});

		test('2 (usage) and 6 (invalid input): nothing written, a plain error', async () => {
			for (const code of [ 2, 6 ]) {
				answer(code, { ok: false, reason: 'x' });
				expect(await set()).toEqual({ ok: false, error: { stage: 'validate', category: 'unknown' } });
			};
		});

		test('3: no item for this connection', async () => {
			answer(3, { ok: false, reason: 'no item for this connection' });
			expect(await retarget()).toEqual({ ok: false, noItem: true });
			expect(await del()).toEqual({ ok: false, noItem: true });
		});

		test('4 is reserved and never returned: seen anyway, it is not taken for a clean failure', async () => {
			answer(4, { ok: false });
			expect(await set()).toEqual({ ok: false, unconfirmed: true });
		});

		test('5: the precondition failed, nothing changed', async () => {
			answer(5, { ok: false, reason: 'precondition failed: the item is not in the expected state' });
			for (const verb of [ set, retarget, del ]) {
				expect(await verb()).toEqual({ ok: false, precondition: true });
			};
		});

		test('7: nothing was read or written — denied (a folder or item rule) or unreachable; never a deletion, never unconfirmed', async () => {
			answer(7, { ok: false, reason: 'x', store: 'denied' });
			for (const verb of [ set, retarget, del ]) {
				expect(await verb()).toEqual({ ok: false, error: { stage: 'write', category: 'storeDenied' } });
			};
			answer(7, { ok: false, reason: 'x', store: 'unreachable' });
			expect(await del()).toEqual({ ok: false, error: { stage: 'write', category: 'unknown' } });
		});

		test('0 with output this module doesn\'t understand, or a receipt for nothing: unconfirmed', async () => {
			answer(0, undefined, 'not json\n');
			expect(await set()).toEqual({ ok: false, unconfirmed: true });
			answer(0, undefined, '{"ok":true,"fingerprint":"' + FP + '","rev":2}\n{"ok":true}\n');
			expect(await set()).toEqual({ ok: false, unconfirmed: true });
			answer(0, { ok: true });
			expect(await set()).toEqual({ ok: false, unconfirmed: true });
			answer(0, { ok: false });
			expect(await retarget()).toEqual({ ok: false, unconfirmed: true });
		});
	});

	test('a verb that doesn\'t end by its deadline is stopped and counts as unconfirmed (it may have written); a check then just couldn\'t say', async () => {
		keyStoreConfig.timeout = 400;
		answer(0, undefined, undefined, true);

		expect(await keySet(env, 'claude-desktop', 'absent', { key: KEY, account: 'acc-a', port: 31012, tier: 'large' })).toEqual({ ok: false, unconfirmed: true });
		expect(await keyDelete(env, 'claude-desktop', STAMP, 'acc-a')).toEqual({ ok: false, unconfirmed: true });
		expect(await keyCheck(env, 'claude-desktop')).toMatchObject({ present: null });
	});

	test('Q2: a verb killed by a signal after it started is unconfirmed (it may have replaced the item); a binary that is missing never started', async () => {
		answer(0, undefined, undefined, false, true);
		expect(await keySet(env, 'claude-desktop', 'absent', { key: KEY, account: 'acc-a', port: 31012, tier: 'large' })).toEqual({ ok: false, unconfirmed: true });
		expect(await keyDelete(env, 'claude-desktop', STAMP, 'acc-a')).toEqual({ ok: false, unconfirmed: true });
		expect(calls()).toHaveLength(2);
	});

	test('a forwarder that can\'t be started at all wrote nothing: a plain error, not unconfirmed', async () => {
		fs.chmodSync(bin, 0o644);
		expect(await keySet(env, 'claude-desktop', 'absent', { key: KEY, account: 'acc-a', port: 31012, tier: 'large' })).toEqual({ ok: false, error: { stage: 'verify', category: 'notFound' } });
	});

	test('a forwarder that isn\'t the one the build was made with is never started, and never sees a key', async () => {
		fs.appendFileSync(bin, '\n// replaced\n');
		answer(0, { ok: true, fingerprint: FP, rev: 1 });

		expect(await keySet(env, 'claude-desktop', 'absent', { key: KEY, account: 'acc-a', port: 31012, tier: 'large' })).toEqual({ ok: false, error: { stage: 'verify', category: 'notFound', path: bin } });
		expect(await keyCheck(env, 'claude-desktop')).toMatchObject({ present: null, error: { category: 'notFound' } });
		expect(await keyDelete(env, 'claude-desktop', STAMP, 'acc-a')).toMatchObject({ ok: false, error: { category: 'notFound' } });
		expect(calls()).toEqual([]);
	});

	test('arguments that could never be valid are refused before anything runs', async () => {
		answer(0, { ok: true, fingerprint: FP, rev: 1 });
		expect(await keySet(env, '../x', 'absent', { key: KEY, account: 'a', port: 31012, tier: 'large' })).toMatchObject({ ok: false, error: { stage: 'validate' } });
		expect(await keySet(env, 'x', 'whatever', { key: KEY, account: 'a', port: 31012, tier: 'large' })).toMatchObject({ ok: false, error: { stage: 'validate' } });
		expect(await keySet(env, 'x', 'absent', { key: '', account: 'a', port: 31012, tier: 'large' })).toMatchObject({ ok: false, error: { stage: 'validate' } });
		expect(await keyRetarget(env, 'x', 'absent', 'a', { port: 31012, tier: 'large' })).toMatchObject({ ok: false, error: { stage: 'validate' } });
		expect(await keyDelete(env, 'x', STAMP, '')).toMatchObject({ ok: false, error: { stage: 'validate' } });
		expect(await keyCheck(env, 'UPPER')).toMatchObject({ present: null });
		expect(calls()).toEqual([]);
	});
});
