const { notarize } = require('electron-notarize');
const { exec } = require('child_process');
const package = require('../../package.json');
const path = require('path');

require('dotenv').config();

function execPromise (command) {
    return new Promise(function(resolve, reject) {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            };

            resolve(stdout.trim());
        });
    });
}

exports.default = async function notarizing (context) {
	if (process.env.ELECTRON_SKIP_NOTARIZE) {
		return;
	};

	const { electronPlatformName, appOutDir } = context;

	if (electronPlatformName == 'darwin') {
		const appName = context.packager.appInfo.productFilename;
	
		return await notarize({
			appBundleId: 'com.anytype.anytype',
			appPath: `${appOutDir}/${appName}.app`,
			appleId: process.env.APPLEID,
			appleIdPassword: process.env.APPLEIDPASS,
			ascProvider: process.env.APPLETEAM,
		});
	};

	if (electronPlatformName == 'win32') {
		let fileName = path.join(context.outDir, `Anytype Setup ${package.version}.exe`);
		let cmd = `AzureSignTool sign -kvu "${process.env.AZURE_KEY_VAULT_URI}" -kvi "${process.env.AZURE_CLIENT_ID}" -kvt "${process.env.AZURE_TENANT_ID}" -kvs "${process.env.AZURE_CLIENT_SECRET}" -kvc ${process.env.AZURE_CERT_NAME} -tr http://timestamp.digicert.com -v "${fileName}"`;

		console.log('[afterSign]: ', fileName);
		console.log('[afterSign]: ', cmd);

		return await execPromise(cmd);
	};

	return null;
};
