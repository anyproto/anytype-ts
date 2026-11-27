const { notarize } = require('@electron/notarize');
const { verifyPackaged } = require('./verify-forwarder.js');

require('dotenv').config();

exports.default = async function notarizing (context) {
	// Only verifies, before anything is notarized: the packaged forwarder is the one the build's metadata and
	// Anytype.mcpb describe. Nothing is signed or rebuilt after the app is sealed
	await verifyPackaged(context);

	if (process.env.ELECTRON_SKIP_NOTARIZE) {
		return;
	};

	const { electronPlatformName, appOutDir } = context;

	if (electronPlatformName == 'darwin') {
		const appName = context.packager.appInfo.productFilename;
	
		return await notarize({
			tool: 'notarytool',
			appPath: `${appOutDir}/${appName}.app`,
			appleId: process.env.APPLEID,
			appleIdPassword: process.env.APPLEIDPASS,
			teamId: process.env.APPLETEAM,
			//appBundleId: 'com.anytype.anytype',
			//ascProvider: process.env.APPLETEAM,
		});
	};

	return null;
};
