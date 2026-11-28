#!/usr/bin/env node
'use strict';

/**
 * Stamps the macOS update floor into every update feed electron-builder wrote: latest-mac.yml, beta-mac.yml,
 * alpha-mac.yml and any other channel a tag produces (v0.47.6-hotfix1 writes hotfix1-mac.yml).
 *
 * Electron 44 and later do not run on macOS 12. electron-updater 6.3.0+ skips an update whose yml has a
 * minimumSystemVersion above os.release(), and on macOS os.release() is the Darwin version, not the macOS one:
 * Darwin 22 is macOS 13. A macOS style value such as "13.0" is not valid semver, so the comparison throws, the
 * updater catches it and lets the update through: it would silently block nobody. electron-builder never writes
 * this field (mac.minimumSystemVersion only reaches Info.plist), so it is added here, after electron-builder runs
 * and before the files are uploaded.
 *
 * The release workflow is the only place feeds are stamped and published. Feeds from local dist:* and publish:*
 * builds carry no floor and must never be uploaded by hand.
 *
 * Usage: node scripts/mac-update-floor.js [dir]   (dir defaults to dist/)
 * Exits non-zero when the folder has no *-mac.yml, when any of them has a version other than package.json's (a stale
 * feed from an earlier build, nothing is written then), or when any of them fails verification afterwards.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { version: VERSION } = require('../package.json');

const KEY = 'minimumSystemVersion';
const FLOOR = '22.0.0';
const dir = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist'));

const fail = (message) => {
	console.error(`[MacUpdateFloor]: ${message}`);
	process.exit(1);
};

const read = (name) => {
	try {
		return yaml.load(fs.readFileSync(path.join(dir, name), 'utf8'));
	} catch (e) {
		fail(`${name}: cannot parse: ${e.message}`);
	};
};

// What the stamp must not change
const snapshot = (data) => JSON.stringify({ version: data?.version, files: data?.files });

let names = [];
try {
	names = fs.readdirSync(dir).filter(it => it.endsWith('-mac.yml')).sort();
} catch (e) {
	fail(`cannot read ${dir}: ${e.message}`);
};

if (!names.length) {
	fail(`no *-mac.yml in ${dir}`);
};

// Every feed is checked before any is written, a feed left over from another build must not be stamped as current
const feeds = {};
const stale = [];

for (const name of names) {
	const data = read(name);

	feeds[name] = data;

	if (data?.version !== VERSION) {
		stale.push(`${name}: version is ${JSON.stringify(data?.version)}, package.json has ${JSON.stringify(VERSION)}`);
	};
};

if (stale.length) {
	fail(`not stamping feeds from another build, no file was changed:\n${stale.join('\n')}`);
};

const before = {};

for (const name of names) {
	const data = feeds[name];

	before[name] = snapshot(data);

	if (KEY in data) {
		console.log(`[MacUpdateFloor]: ${name} already has ${KEY} ${JSON.stringify(data[KEY])}`);
		continue;
	};

	// Appended rather than re-serialized, so the rest of the file stays byte for byte as electron-builder wrote it
	const fp = path.join(dir, name);
	const content = fs.readFileSync(fp, 'utf8');
	const separator = (content && !content.endsWith('\n')) ? '\n' : '';

	fs.writeFileSync(fp, `${content}${separator}${KEY}: '${FLOOR}'\n`);
	console.log(`[MacUpdateFloor]: ${name} ${KEY} ${FLOOR}`);
};

const errors = [];

for (const name of names) {
	const data = read(name);

	if (!data || (typeof data != 'object')) {
		errors.push(`${name}: not a YAML mapping`);
		continue;
	};

	if (data[KEY] !== FLOOR) {
		errors.push(`${name}: ${KEY} is ${JSON.stringify(data[KEY])}, expected ${JSON.stringify(FLOOR)}`);
	};

	if (data.version !== VERSION) {
		errors.push(`${name}: version is ${JSON.stringify(data.version)}, package.json has ${JSON.stringify(VERSION)}`);
	};

	if (!Array.isArray(data.files) || !data.files.length || data.files.some(it => !it?.url || !it?.sha512)) {
		errors.push(`${name}: files is missing or has an entry without url and sha512`);
	};

	if (snapshot(data) !== before[name]) {
		errors.push(`${name}: version or files changed`);
	};
};

if (errors.length) {
	fail(`verification failed:\n${errors.join('\n')}`);
};

console.log(`[MacUpdateFloor]: verified ${names.join(', ')}`);
