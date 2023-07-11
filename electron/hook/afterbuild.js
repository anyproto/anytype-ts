const { exec } = require('child_process');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

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

function hashFile (file, algorithm, encoding, options) {
	return new Promise((resolve, reject) => {
		
		const hash = crypto.createHash(algorithm);

		hash.on('error', reject).setEncoding(encoding);

		fs.createReadStream(file, { ...options, highWaterMark: 1024 * 1024 /* better to use more memory but hash faster */ })
		.on('error', reject)
		.on('end', () => {
			hash.end()
			resolve(hash.read())
		})
		.pipe(hash, { end: false });
	});
};

exports.default = async function (context) {
	const { packager, file, updateInfo } = context;
	const version = packager.appInfo.version;

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
		const hex = await hashFile(fileName, 'sha512', 'base64', {});
		const size = stats.size;

		console.log([
			`Old size: ${updateInfo.size}`,
			`Old sha512: ${updateInfo.sha512}`,
			`New size: ${size}`,
			`New sha512: ${hex}`,
		].join('\n'));

		let files = [];
		if (version.match('alpha')) {
			files = files.concat([ 'alpha' ]);
		} else
		if (version.match('beta')) {
			files = files.concat([ 'alpha', 'beta' ]);
		} else {
			files = files.concat([ 'alpha', 'beta', 'latest' ]);
		};

		console.log(`Files to update: ${files.join(', ')}`);

		files.forEach(it => {
			const fp = path.join(path.dirname(fileName), `${it}.yml`);
			const dir = fs.readdirSync(path.dirname(fileName));

			console.log(dir);

			let fc = fs.readFileSync(fp);

			console.log(`File ${fp}: ${fc}`);

			fc = fc.replace(/sha512: .*$/g, `sha512: ${hex}`);
			fc = fc.replace(/size: .*$/g, `size: ${size}`);

			fs.writeFileSync(fp, fc);

			console.log(fc);
		});

		return ret;
	};

	return null;
};
