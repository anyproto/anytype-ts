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
const util = require('util');
const { fixPathForAsarUnpack, is } = require('electron-util');

const APP_NAME = 'com.anytype.desktop';
const MANIFEST_FILENAME = `${APP_NAME}.json`;
const EXTENSION_IDS = [ 'jbnammhjiplhpjfncnlejjjejghimdkf', 'jkmhmgghdjjbafmkgjmplhemjjnkligf', 'lcamkcmpcofgmbmloefimnelnjpcdpfn' ];
const GECKO_ID = 'anytype@anytype.io';
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

	switch (platform) {
		case 'win32': {
			installToWindows();
			break;
		};
		case 'darwin': {
			installToMacOS();
			break;
		};
		case 'linux': {
			installToLinux();
			break;
		};
		default: {
			console.log('[InstallNativeMessaging] Unsupported platform:', platform);
			break;
		};
	};
};

// Firefox uses allowed_extensions, Chromium-based browsers use allowed_origins
const buildManifestForBrowserKey = (key) => {
	const base = {
		name: APP_NAME,
		description: 'Anytype desktop <-> web clipper bridge',
		type: 'stdio',
		path: getManifestPath(),
	};

	if (key === 'Firefox') {
		base.allowed_extensions = [ GECKO_ID ];
	} else {
		base.allowed_origins = EXTENSION_IDS.map(id => `chrome-extension://${id}/`);
	};

	return base;
};

const installToMacOS = () => {
	const dirs = getDarwinDirectory();

	for (const [ key, value ] of Object.entries(dirs)) {
		if (fs.existsSync(value)) {
			const dst = path.join(value, 'NativeMessagingHosts', MANIFEST_FILENAME);
			writeManifest(dst, buildManifestForBrowserKey(key));
		} else {
			console.log('[InstallNativeMessaging] Manifest skipped:', key);
		};
	};
};

const getLinuxNativeMessagingDirName = (key) => {
	if (key === 'Firefox') {
		return 'native-messaging-hosts';
	} else {
		return 'NativeMessagingHosts';
	};
};

const installToLinux = () => {
	const dirs = getLinuxDirectory();

	for (const [ key, value ] of Object.entries(dirs)) {
		if (fs.existsSync(value)) {
			const nmDir = getLinuxNativeMessagingDirName(key);
			const dst = path.join(value, nmDir, MANIFEST_FILENAME);
			writeManifest(dst, buildManifestForBrowserKey(key));
		} else {
			console.log('[InstallNativeMessaging] Manifest skipped:', key);
		};
	};
};

const installToWindows = () => {
	const dir = path.join(USER_PATH, 'browsers');

	const chromeManifestPath = path.join(dir, 'chrome.json');
	const firefoxManifestPath = path.join(dir, 'firefox.json');

	writeManifest(chromeManifestPath, buildManifestForBrowserKey('Chrome'));
	writeManifest(firefoxManifestPath, buildManifestForBrowserKey('Firefox'));

	createWindowsRegistry(
		'HKCU\\SOFTWARE\\Google\\Chrome',
		`HKCU\\SOFTWARE\\Google\\Chrome\\NativeMessagingHosts\\${APP_NAME}`,
		chromeManifestPath
	);

	createWindowsRegistry(
		'HKCU\\SOFTWARE\\Mozilla',
		`HKCU\\SOFTWARE\\Mozilla\\NativeMessagingHosts\\${APP_NAME}`,
		firefoxManifestPath
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

	console.log('[InstallNativeMessaging] Adding registry:', location);

	// Check installed
	try {
		await list(check);
	} catch {
		console.log('[InstallNativeMessaging] Registry not found:', check);
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
		console.log('[InstallNativeMessaging] Registry create error:', error);
	};
};

const getLinuxDirectory = () => {
	const home = path.join(getHomeDir(), '.config');

	/* eslint-disable no-useless-escape */

	return {
		'Chrome': path.join(home, 'google-chrome'),
		'Chromium': path.join(home, 'chromium'),
		'Brave': path.join(home, 'BraveSoftware', 'Brave-Browser'),
		'BraveFlatpak': path.join('.var', 'app', 'com.brave.Browser', 'config', 'BraveSoftware', 'Brave-Browser'),
		'Firefox': path.join(getHomeDir(), '.mozilla'),
	};
};

const getDarwinDirectory = () => {
	const home = path.join(getHomeDir(), 'Library', 'Application Support');

	/* eslint-disable no-useless-escape */

	return {
		'Firefox': path.join(home, 'Mozilla'),
		'Chrome': path.join(home, 'Google', 'Chrome'),
		'Chrome Beta': path.join(home, 'Google', 'Chrome Beta'),
		'Chrome Dev': path.join(home, 'Google', 'Chrome Dev'),
		'Chrome Canary': path.join(home, 'Google', 'Chrome Canary'),
		'Chromium': path.join(home, 'Chromium'),
		'Microsoft Edge': path.join(home, 'Microsoft Edge'),
		'Microsoft Edge Beta': path.join(home, 'Microsoft Edge Beta'),
		'Microsoft Edge Dev': path.join(home, 'Microsoft Edge Dev'),
		'Microsoft Edge Canary': path.join(home, 'Microsoft Edge Canary'),
		'Vivaldi': path.join(home, 'Vivaldi'),
	};
	/* eslint-enable no-useless-escape */
};

const writeManifest = (dst, data) => {
	try {
		if (!fs.existsSync(path.dirname(dst))) {
			fs.mkdirSync(path.dirname(dst), { recursive: true });
		};

		fs.writeFileSync(dst, JSON.stringify(data, null, 2), {});
		console.log('[InstallNativeMessaging] Manifest written:', dst);
	} catch(err) {
		console.error(err);
	};

};

module.exports = { installNativeMessagingHost };
