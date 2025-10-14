const fs = require('fs');
const path = require('path');

const paths = () => {
	const root = path.resolve(__dirname, '..', '..');
	const dir = path.join(root, 'dist', 'extension');
	return {
		dir,
		dest: path.join(dir, 'manifest.json'),
		firefox: path.join(dir, 'manifest.firefox.json'),
		chromium: path.join(dir, 'manifest.chromium.json'),
	};
};

const getTarget = (argv) => {
	const arg = (argv[0] || '').toLowerCase();

	if (!['firefox', 'chromium'].includes(arg)) {
		throw new Error('Usage: node electron/hook/switch-manifest.js <firefox|chromium>');
	};

	return arg;
};

const run = () => {
	const target = getTarget(process.argv.slice(2));

	const { dir, dest, ...manifests } = paths();
	const src = manifests[target];

	fs.copyFileSync(src, dest);
	console.log(`[switch-manifest] ${target} -> ${path.relative(dir, dest)}`);
};

run();
