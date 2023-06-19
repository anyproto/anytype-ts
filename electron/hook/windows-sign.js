const { exec } = require('child_process');
const os = require('os');

require('dotenv').config();

exports.default = function (context) {
	const platform = os.platform();

	console.log('[afterAllArtifactBuild]: ', platform);

	if (platform !== 'win32') {
		return;
	};

	let fileName = context.artifactPaths.filter(it => it.match(/exe$/))[0];
	let cmd = `AzureSignTool sign -kvu "${process.env.AZURE_KEY_VAULT_URI}" -kvi "${process.env.AZURE_CLIENT_ID}" -kvt "${process.env.AZURE_TENANT_ID}" -kvs "${process.env.AZURE_CLIENT_SECRET}" -kvc ${process.env.AZURE_CERT_NAME} -tr http://timestamp.digicert.com -v "${fileName}"`;

	console.log('[afterAllArtifactBuild]: ', fileName);
	console.log('[afterAllArtifactBuild]: ', cmd);

	exec(cmd, (error, stdout, stderr) => {
		if (error) {
			console.log(`error: ${error.message}`);
			return;
		}
		if (stderr) {
			console.log(`stderr: ${stderr}`);
			return;
		}
		console.log(`stdout: ${stdout}`);
	});

	return '';
};