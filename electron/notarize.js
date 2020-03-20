require('dotenv').config();
const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
	if (process.env.ELECTRON_SKIP_NOTARIZE) {
		return;
	};
	
	const { electronPlatformName, appOutDir } = context;
	if (electronPlatformName !== 'darwin') {
		return;
	};
	
	const appName = context.packager.appInfo.productFilename;
	
	return await notarize({
		appBundleId: 'com.anytype.anytype2',
		appPath: `${appOutDir}/${appName}.app`,
		appleId: process.env.APPLEID,
		appleIdPassword: process.env.APPLEIDPASS,
	});
};
