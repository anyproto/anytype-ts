const { exec } = require('child_process');
const fs = require('fs');
const crypto = require('crypto');

require('dotenv').config();

function execPromise (command) {
    return new Promise(function(resolve, reject) {
        exec(command, (error, stdout, stderr) => {
			console.log('Error: ', error, stderr);

            if (error || stderr) {
                reject(error || stderr);
                return;
            };

			console.log('Out: ', stdout.trim());

            resolve(stdout.trim());
        });
    });
};

exports.default = async function (context) {
	const { packager, file } = context;

	console.log(context);

	if (packager.platform.name == 'windows') {
		const fileName = file.replace('.blockmap', '');
		const cmd = [
			`AzureSignTool.exe sign`,
			`-du "https://anytype.io"`,
			`-fd sha384`,
			`-td sha384`,
			`-tr http://timestamp.digicert.com`,
			`--azure-key-vault-url "${process.env.AZURE_KEY_VAULT_URI}"`,
			`--azure-key-vault-client-id "${process.env.AZURE_CLIENT_ID}"`,
			`--azure-key-vault-tenant-id "${process.env.AZURE_TENANT_ID}"`,
			`--azure-key-vault-client-secret "${process.env.AZURE_CLIENT_SECRET}"`,
			`--azure-key-vault-certificate "${process.env.AZURE_CERT_NAME}"`,
			`-v`,
			`"${fileName}"`,
		].join(' ');

		console.log(cmd);

		const ret = await execPromise(cmd);
		const stats = fs.statSync(fileName);
		const size = stats.size;
		const fileBuffer = fs.readFileSync(fileName);
		const hashSum = crypto.createHash('sha512');
		
		hashSum.update(fileBuffer);

		const hex = hashSum.digest('hex');

		console.log([
			`Old size: ${context.updateInfo.size}`,
			`Old sha512: ${context.updateInfo.sha512}`,
			`New size: ${stats.size}`,
			`New sha512: ${hex}`,
		].join('\n'));

		return ret;
	};

	return null;
};
