const esbuild = require('esbuild');
const path = require('path');

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
		'linux-distro',
		'regedit',
	],
	tsconfig: path.join(__dirname, '..', 'tsconfig.electron.json'),
	logLevel: 'info',
};

async function build() {
	if (watch) {
		const ctx = await esbuild.context(buildOptions);
		await ctx.watch();
		console.log('[build-electron] Watching for changes...');
	} else {
		await esbuild.build(buildOptions);
	}
}

build().catch((err) => {
	console.error(err);
	process.exit(1);
});
