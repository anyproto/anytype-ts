const path = require('path');
const { execFile } = require('child_process');

const SECRETS = [ 'AZURE_KEY_VAULT_URI', 'AZURE_CLIENT_ID', 'AZURE_TENANT_ID', 'AZURE_CLIENT_SECRET', 'AZURE_CERT_NAME' ];

/** Output that may be logged: every AZURE_* value replaced */
const redact = (text) => {
	let ret = String(text || '');

	for (const k of SECRETS) {
		const v = process.env[k];

		if (v) {
			ret = ret.split(v).join('***');
		};
	};
	return ret;
};

/** AzureSignTool with an argument array and no shell: no secret is ever part of a command line that gets logged */
const run = (file, args) => new Promise((resolve) => {
	execFile(file, args, { windowsHide: true }, (error, stdout, stderr) => {
		resolve({ code: error ? ((typeof error.code == 'number') ? error.code : 1) : 0, stdout: String(stdout || ''), stderr: String(stderr || '') });
	});
});

/**
 * electron-builder calls the hook as `(configuration, packager)` (CustomWindowsSign): only the first argument
 * is ours. Tests replace `exports.runner`, never a parameter
 */
const sign = async function (context) {
	const runner = exports.runner;

	if (process.env.ELECTRON_SKIP_NOTARIZE) {
		return;
	};

	// anytype-mcp.exe is signed once, before the frontend build (scripts/prepare-forwarder.js calls this hook with
	// `forwarder: true`): Anytype.mcpb and the build's metadata carry those bytes, so electron-builder must not sign it again
	if (!context.forwarder && (path.win32.basename(String(context.path || '')).toLowerCase() == 'anytype-mcp.exe')) {
		return;
	};

	const args = [
		'sign',
		'-du', String(context.site || ''),
		'-fd', 'sha384',
		'-td', 'sha384',
		'-tr', 'http://timestamp.digicert.com',
		'--azure-key-vault-url', String(process.env.AZURE_KEY_VAULT_URI || ''),
		'--azure-key-vault-client-id', String(process.env.AZURE_CLIENT_ID || ''),
		'--azure-key-vault-tenant-id', String(process.env.AZURE_TENANT_ID || ''),
		'--azure-key-vault-client-secret', String(process.env.AZURE_CLIENT_SECRET || ''),
		'--azure-key-vault-certificate', String(process.env.AZURE_CERT_NAME || ''),
		'-v',
		String(context.path || ''),
	];
	const res = await runner('AzureSignTool.exe', args);

	console.log('Stdout: ', redact(res.stdout));
	if (res.stderr) {
		console.log('Stderr: ', redact(res.stderr));
	};
	if (res.code != 0) {
		// Never the command line: it holds the client secret
		throw new Error(`AzureSignTool failed (exit ${res.code})`);
	};
	return redact(res.stdout).trim();
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
exports.default = (configuration, _packager) => sign(configuration);
exports.runner = run;
exports.redact = redact;
