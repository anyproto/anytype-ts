const { exec } = require('child_process');
const package = require('../../package.json');
const path = require('path');
const fs = require('fs');

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
};

exports.default = async function (context) {
	const { packager, file } = context;

	if (packager.platform.name == 'windows') {
		let cmd = `AzureSignTool sign -kvu "${process.env.AZURE_KEY_VAULT_URI}" -kvi "${process.env.AZURE_CLIENT_ID}" -kvt "${process.env.AZURE_TENANT_ID}" -kvs "${process.env.AZURE_CLIENT_SECRET}" -kvc ${process.env.AZURE_CERT_NAME} -tr http://timestamp.digicert.com -v "${file}"`;

		console.log('[afterSign]: ', cmd);

		return await execPromise(cmd);
	};

	return null;
};
