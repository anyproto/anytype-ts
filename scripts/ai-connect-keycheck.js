#!/usr/bin/env node
/**
 * Quiet check that a key appears in no file under a directory (e.g. Anytype's userData: registry, logs).
 *
 *   <command that prints the key> | node scripts/ai-connect-keycheck.js <dir>
 *
 * The key is read from stdin, never from the command line. Output is never the key or a matching line:
 * - PASS: every file was read and none contains the key (exit 0);
 * - FAIL + the names of the files that contain it (exit 1);
 * - INCOMPLETE + the paths that could not be scanned: unreadable directories and files, files above
 *   the size cap (exit 3). A key inside a printed path is replaced by <KEY>.
 * Symlinks are not followed.
 */
const fs = require('fs');
const path = require('path');

// AI_CONNECT_KEYCHECK_MAX_BYTES lowers the cap for tests
const MAX_FILE = Number(process.env.AI_CONNECT_KEYCHECK_MAX_BYTES) || (512 * 1024 * 1024);

const readStdin = () => new Promise((resolve) => {
	const chunks = [];

	process.stdin.on('data', (c) => chunks.push(c));
	process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
	process.stdin.on('error', () => resolve(''));
});

const walk = (dir, files, unscanned) => {
	let entries = [];

	try {
		entries = fs.readdirSync(dir, { withFileTypes: true });
	} catch (e) {
		unscanned.push(dir);
		return;
	};

	for (const entry of entries) {
		const p = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			walk(p, files, unscanned);
		} else
		if (entry.isFile()) {
			files.push(p);
		};
	};
};

const main = async () => {
	const dir = process.argv[2];

	if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
		console.log('usage: <key on stdin> | node scripts/ai-connect-keycheck.js <dir>');
		return 2;
	};

	const key = (await readStdin()).replace(/\r?\n$/, '');

	if (key.length < 8) {
		console.log('usage: the key on stdin is missing or too short');
		return 2;
	};

	const needle = Buffer.from(key, 'utf8');
	const show = (p) => path.relative(dir, p).split(key).join('<KEY>') || '.';
	const files = [];
	const unscanned = [];
	const hits = [];

	walk(dir, files, unscanned);

	for (const file of files) {
		try {
			if (fs.statSync(file).size > MAX_FILE) {
				unscanned.push(file);
				continue;
			};
			if (fs.readFileSync(file).includes(needle)) {
				hits.push(file);
			};
		} catch (e) {
			unscanned.push(file);
		};
	};

	if (hits.length) {
		console.log('FAIL');
		hits.forEach(h => console.log(show(h)));
	};

	if (unscanned.length) {
		console.log('INCOMPLETE');
		unscanned.forEach(u => console.log(`unscanned: ${show(u)}`));
	};

	if (hits.length) {
		return 1;
	};
	if (unscanned.length) {
		return 3;
	};

	console.log('PASS');
	return 0;
};

main().then(code => process.exit(code));
