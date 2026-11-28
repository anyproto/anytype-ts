const esbuild = require('esbuild');
const path = require('path');
const buildMcp = require('./build-mcp');
const prepareForwarder = require('./prepare-forwarder');

const watch = process.argv.includes('--watch');

const buildOptions = {
	entryPoints: [path.join(__dirname, '..', 'electron', 'ts', 'main.ts')],
	bundle: true,
	platform: 'node',
	target: 'node24',
	format: 'cjs',
	outfile: path.join(__dirname, '..', 'electron.js'),
	sourcemap: false,
	external: [
		'electron',
		'electron-updater',
		'electron-util',
		'electron-log',
		'electron-json-storage',
		'electron-window-state',
		'electron-dl',
		'@electron/remote',
		'@electron/remote/main',
		'@tomjs/electron-devtools-installer',
		'keytar',
		'check-disk-space',
		'sanitize-filename',
		'mime-types',
		'regedit',
	],
	tsconfig: path.join(__dirname, '..', 'tsconfig.electron.json'),
	logLevel: 'info',
};

async function build() {
	// The forwarder first: placed in dist/ and signed, so dist/mcp/Anytype.mcpb packs the signed bytes
	const forwarder = await prepareForwarder.prepare();

	if (watch) {
		const ctx = await esbuild.context(buildOptions);
		await ctx.watch();
		console.log('[build-electron] Watching for changes...');
	} else {
		await esbuild.build(buildOptions);
	}

	// dist/mcp (the skill and the Claude bundle) and the build's metadata electron/json/aiConnect.build.json
	// (once, also in watch mode)
	await buildMcp.build({ forwarder });
}

build().catch((err) => {
	console.error(err);
	process.exit(1);
});
