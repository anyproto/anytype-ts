/* 

- This file is responsible for installing the native messaging host manifest file in the correct location for each browser on each platform.
- It is idempotent, meaning it can run multiple times without causing any problems.
- The native messaging host is a small executable that can be called by the Webclipper browser extension.
- the executable remains in the anytype application files, but the manifest file is installed in each browser's unique nativeMessagingHost directory.
- Read about what the actual executable does in the file: go/nativeMessagingHost.go

*/

const fs = require('fs');
const { userInfo, homedir } = require('os');
const { app } = require('electron');
const path = require('path');
const util = require('../util.js');
const { fixPathForAsarUnpack, is } = require('electron-util');

const APP_NAME = 'com.anytype.desktop';
const MANIFEST_FILENAME = `${APP_NAME}.json`;
const EXTENSION_IDS = [ 'jbnammhjiplhpjfncnlejjjejghimdkf', 'jkmhmgghdjjbafmkgjmplhemjjnkligf' ];
const USER_PATH = app.getPath('userData');
const EXE_PATH = app.getPath('exe');

const getManifestPath = () => {
	const fn = `nativeMessagingHost${is.windows ? '.exe' : ''}`;
	return path.join(fixPathForAsarUnpack(__dirname), '..', '..', '..', 'dist', fn);
};

const getHomeDir = () => {
	if (process.platform === 'darwin') {
		return userInfo().homedir;
	} else {
		return homedir();
	};
};

const installNativeMessagingHost = () => {
	const { platform } = process;

	// TODO make sure this is idempotent

	const manifest = {
		name: APP_NAME,
		description: 'Anytype desktop <-> web clipper bridge',
		type: 'stdio',
		allowed_origins: EXTENSION_IDS.map(id => `chrome-extension://${id}/`),
		path: getManifestPath(),
	};

	switch (platform) {
		case 'win32': {
			installToWindows(manifest);
			break;
		}
		case 'darwin': {
			installToMacOS(manifest);
			break;
		}
		case 'linux':
			installToLinux(manifest);
			break;
		default:
			console.log('unsupported platform: ', platform);
			break;
	};
};

const installToMacOS = (manifest) => {
	const dirs = getDarwinDirectory();

	for (const [ key, value ] of Object.entries(dirs)) {
		if (fs.existsSync(value)) {
			writeManifest(path.join(value, 'NativeMessagingHosts', MANIFEST_FILENAME), manifest);
		} else {
			console.log(`Manifest skipped: ${key}`);
		};
	};
};

const installToLinux = (manifest) => {
	const dir = `${getHomeDir()}/.config/google-chrome/`;

	writeManifest(`${dir}NativeMessagingHosts/${MANIFEST_FILENAME}`, manifest);
};

const installToWindows = (manifest) => {
	const dir = path.join(USER_PATH, 'browsers');

	writeManifest(path.join(dir, 'chrome.json'), manifest);
	createWindowsRegistry(
		'HKCU\\SOFTWARE\\Google\\Chrome',
		`HKCU\\SOFTWARE\\Google\\Chrome\\NativeMessagingHosts\\${APP_NAME}`,
		path.join(dir, 'chrome.json')
	);
};

const getRegeditInstance = () => {
	// eslint-disable-next-line
	const regedit = require('regedit');
	regedit.setExternalVBSLocation(
		path.join(path.dirname(EXE_PATH), 'resources/regedit/vbs')
	);
	return regedit;
};

const createWindowsRegistry = async (check, location, jsonFile) => {
	const regedit = getRegeditInstance();
	const list = util.promisify(regedit.list);
	const createKey = util.promisify(regedit.createKey);
	const putValue = util.promisify(regedit.putValue);

	console.log(`Adding registry: ${location}`);

	// Check installed
	try {
		await list(check);
	} catch {
		console.log(`Not finding registry ${check} skipping.`);
		return;
	};

	try {
		await createKey(location);

		// Insert path to manifest
		const obj = {};
		obj[location] = {
			default: {
				value: jsonFile,
				type: 'REG_DEFAULT',
			},
		};

		return putValue(obj);
	} catch (error) {
		console.log(error);
	};
};

const getDarwinDirectory = () => {
	const HOME_DIR = getHomeDir();
	/* eslint-disable no-useless-escape */
	return {
		Firefox: `${HOME_DIR}/Library/Application\ Support/Mozilla/`,
		Chrome: `${HOME_DIR}/Library/Application\ Support/Google/Chrome/`,
		'Chrome Beta': `${HOME_DIR}/Library/Application\ Support/Google/Chrome\ Beta/`,
		'Chrome Dev': `${HOME_DIR}/Library/Application\ Support/Google/Chrome\ Dev/`,
		'Chrome Canary': `${HOME_DIR}/Library/Application\ Support/Google/Chrome\ Canary/`,
		Chromium: `${HOME_DIR}/Library/Application\ Support/Chromium/`,
		'Microsoft Edge': `${HOME_DIR}/Library/Application\ Support/Microsoft\ Edge/`,
		'Microsoft Edge Beta': `${HOME_DIR}/Library/Application\ Support/Microsoft\ Edge\ Beta/`,
		'Microsoft Edge Dev': `${HOME_DIR}/Library/Application\ Support/Microsoft\ Edge\ Dev/`,
		'Microsoft Edge Canary': `${HOME_DIR}/Library/Application\ Support/Microsoft\ Edge\ Canary/`,
		Vivaldi: `${HOME_DIR}/Library/Application\ Support/Vivaldi/`,
	};
	/* eslint-enable no-useless-escape */
};

const writeManifest = (dst, data) => {
	try {
		if (!fs.existsSync(path.dirname(dst))) {
			fs.mkdirSync(path.dirname(dst));
		};

		fs.writeFileSync(dst, JSON.stringify(data, null, 2), {}, (err) => {
			if (err) {
				console.log(err);
			} else {
				console.log(`Manifest written: ${dst}`);
			};
		});

		console.log(`Manifest written: ${dst}`);
	} catch(err) {
		console.error(err);
	};

};

module.exports = { installNativeMessagingHost };