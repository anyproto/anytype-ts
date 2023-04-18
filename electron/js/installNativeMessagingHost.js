/* 

- This file is responsible for installing the native messaging host manifest file in the correct location for each browser on each platform.
- It is idempotent, meaning it can run multiple times without causing any problems.
- The native messaging host is a small executable that can be called by the Webclipper browser extension.
- the executable remains in the anytype application files, but the manifest file is installed in each browser's unique nativeMessagingHost directory.
- Read about what the actual executable does in the file: nativeMessagingHost.go
- For full docs on this system, checkout the webclipper repository: https://github.com/anytypeio/webclipper

*/

const { existsSync, mkdir, writeFile } = require('fs');
const { userInfo, homedir } = require('os');
const { app } = require('electron');
const path = require('path');
const util = require('./util.js');
const { fixPathForAsarUnpack, is } = require('electron-util');

const APP_NAME = 'com.anytype.anytype_desktop';
const MANIFEST_FILENAME = `${APP_NAME}.json`;
const EXTENSION_ID = 'mpblapehafmfffjkfphbegolnpgdjeof';
const USER_PATH = app.getPath('userData');
const EXE_PATH = app.getPath('exe');

const getManifestPath = () => fixPathForAsarUnpack(path.join(process.cwd(), 'dist', `nativeMessagingHost${is.windows ? '.exe' : ''}`));

const getHomeDir = () => {
	if (process.platform === 'darwin') {
		return userInfo().homedir;
	} else {
		return homedir();
	}
};

const installNativeMessagingHost = () => {
	const { platform } = process;

	// TODO make sure this is idempotent

	const manifest = {
		name: APP_NAME,
		description: 'Anytype desktop <-> web clipper bridge',
		type: 'stdio',
		allowed_origins: [`chrome-extension://${EXTENSION_ID}/`],
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
	}
};

const installToWindows = (manifest) => {
	const destination = path.join(USER_PATH, 'browsers');
	manifest.path = getManifestPath();
	writeManifest(path.join(destination, 'chrome.json'), manifest);

	createWindowsRegistry(
		'HKCU\\SOFTWARE\\Google\\Chrome',
		`HKCU\\SOFTWARE\\Google\\Chrome\\NativeMessagingHosts\\${APP_NAME}`,
		path.join(destination, 'chrome.json')
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
	}

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
	}
};

const installToMacOS = (manifest) => {
	const nmhs = getDarwinNMHDirectory();
	manifest.path = getManifestPath();

	for (const [key, value] of Object.entries(nmhs)) {
		if (existsSync(value)) {
			const p = path.join(
				value,
				'NativeMessagingHosts',
				MANIFEST_FILENAME
			);
			console.log(p);

			writeManifest(p, manifest).catch((e) =>
				console.log(`Error writing manifest for ${key}. ${e}`)
			);
		} else {
			console.log(`Warning: ${key} not found skipping.`);
		}
	}
};

const getDarwinNMHDirectory = () => {
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

const installToLinux = (manifest) => {
	manifest.path = getManifestPath();
	const config_dir = `${getHomeDir()}/.config/google-chrome/`;

	if (existsSync(config_dir)) {
		writeManifest(
			`${config_dir}NativeMessagingHosts/${MANIFEST_FILENAME}`,
			manifest
		);
	}
};

const writeManifest = async (destination, manifest) => {
	if (!existsSync(path.dirname(destination))) {
		await mkdir(path.dirname(destination));
	}
	writeFile(destination, JSON.stringify(manifest, null, 2), console.log);
};

module.exports = { installNativeMessagingHost };
