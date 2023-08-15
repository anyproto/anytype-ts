const Util = require('./util.js');

exports.default = async function (context) {
	if (process.env.ELECTRON_SKIP_NOTARIZE) {
		return;
	};

	const cmd = [
		`AzureSignTool.exe sign`,
		`-du "${context.site}"`,
		`-fd sha384`,
		`-td sha384`,
		`-tr http://timestamp.digicert.com`,
		`--azure-key-vault-url "${process.env.AZURE_KEY_VAULT_URI}"`,
		`--azure-key-vault-client-id "${process.env.AZURE_CLIENT_ID}"`,
		`--azure-key-vault-tenant-id "${process.env.AZURE_TENANT_ID}"`,
		`--azure-key-vault-client-secret "${process.env.AZURE_CLIENT_SECRET}"`,
		`--azure-key-vault-certificate "${process.env.AZURE_CERT_NAME}"`,
		`-v`,
		`"${context.path}"`,
	].join(' ');

	return await Util.execPromise(cmd);
};