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
		const fileName = file.replace('.blockmap', '');
		const cmd = `
			AzureSignTool.exe sign 
			-du "Anytype"
			-fd sha384 
			-td sha384
			-tr https://freetsa.org
			--azure-key-vault-url "${process.env.AZURE_KEY_VAULT_URI}"
			--azure-key-vault-client-id "${process.env.AZURE_CLIENT_ID}"
			--azure-key-vault-tenant-id "${process.env.AZURE_TENANT_ID}"
			--azure-key-vault-client-secret "${process.env.AZURE_CLIENT_SECRET}"
			--azure-key-vault-certificate "${process.env.AZURE_CERT_NAME}"
			-v
			-ifl "${fileName}"
		`

		console.log('[afterSign]: ', cmd);

		return await execPromise(cmd);
	};

	return null;
};
