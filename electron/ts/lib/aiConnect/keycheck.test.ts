/**
 * scripts/ai-connect-keycheck.js: the key comes on stdin; output is PASS, or FAIL plus file names only.
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { tempDir } from './testEnv';

const SCRIPT = path.join(__dirname, '..', '..', '..', '..', 'scripts', 'ai-connect-keycheck.js');
const KEY = 'SENTINEL-keycheck-0123456789';

let dir = '';

beforeEach(() => {
	dir = tempDir('aic-check-');
	fs.mkdirSync(path.join(dir, 'logs'));
	fs.writeFileSync(path.join(dir, 'aiConnect.json'), '{"keyFp":"0123456789abcdef"}');
});

afterEach(() => {
	fs.rmSync(dir, { recursive: true, force: true });
});

const check = (input: string, target = dir, env: Record<string, string> = {}) => spawnSync(process.execPath, [ SCRIPT, target ], { input, encoding: 'utf8', env: { ...process.env, ...env } });
const itPosix = ((process.platform != 'win32') && (process.getuid?.() !== 0)) ? test : test.skip;

test('PASS when no file holds the key', () => {
	const res = check(KEY + '\n');

	expect(res.status).toBe(0);
	expect(res.stdout).toBe('PASS\n');
});

test('FAIL names the files, never the key or the line', () => {
	fs.writeFileSync(path.join(dir, 'logs', 'main.log'), `line before\ntoken=${KEY} leaked\n`);

	const res = check(KEY);

	expect(res.status).toBe(1);
	expect(res.stdout).toBe(`FAIL\n${path.join('logs', 'main.log')}\n`);
	expect(res.stdout + res.stderr).not.toContain(KEY);
	expect(res.stdout).not.toContain('leaked');
});

test('usage errors: no dir, no key on stdin', () => {
	expect(check(KEY, path.join(dir, 'missing')).status).toBe(2);
	expect(check('').status).toBe(2);
});

itPosix('an unreadable directory or file makes the scan INCOMPLETE, never PASS', () => {
	const sub = path.join(dir, 'locked');
	const file = path.join(dir, 'logs', 'secret.log');

	fs.mkdirSync(sub);
	fs.writeFileSync(path.join(sub, 'inside.log'), KEY);
	fs.writeFileSync(file, 'x');
	fs.chmodSync(sub, 0o000);
	fs.chmodSync(file, 0o000);

	try {
		const res = check(KEY);

		expect(res.status).toBe(3);
		expect(res.stdout).toBe(`INCOMPLETE\nunscanned: locked\nunscanned: ${path.join('logs', 'secret.log')}\n`);
		expect(res.stdout).not.toContain('PASS');
	} finally {
		fs.chmodSync(sub, 0o700);
		fs.chmodSync(file, 0o600);
	};
});

test('a file above the size cap is reported unscanned', () => {
	fs.writeFileSync(path.join(dir, 'logs', 'big.log'), 'x'.repeat(200));

	const res = check(KEY, dir, { AI_CONNECT_KEYCHECK_MAX_BYTES: '100' });

	expect(res.status).toBe(3);
	expect(res.stdout).toBe(`INCOMPLETE\nunscanned: ${path.join('logs', 'big.log')}\n`);
});

test('a key inside a printed path is redacted', () => {
	fs.writeFileSync(path.join(dir, `dump-${KEY}.log`), KEY);

	const res = check(KEY);

	expect(res.status).toBe(1);
	expect(res.stdout).toBe('FAIL\ndump-<KEY>.log\n');
	expect(res.stdout).not.toContain(KEY);
});
