#!/usr/bin/env node
'use strict';

/**
 * Analyzes electron.js dependencies using esbuild to determine which
 * node_modules are needed at runtime for ASAR packaging.
 * Replaces the previous rspack.node.config.js + save-node-deps.js pipeline.
 */

const fs = require('fs');
const path = require('path');

const skipIds = ['electron'];

async function main() {
	// esbuild is bundled with Vite, so it's always available
	const esbuild = require('esbuild');

	const result = await esbuild.build({
		entryPoints: [path.resolve(__dirname, '..', 'electron.js')],
		bundle: true,
		platform: 'node',
		write: false,
		metafile: true,
		external: ['electron'],
		logLevel: 'silent',
		plugins: [{
			name: 'ignore-node-addons',
			setup(build) {
				build.onResolve({ filter: /\.node$/ }, (args) => ({
					path: args.path,
					external: true,
				}));
			},
		}],
	});

	// Extract node_modules paths from metafile
	const inputs = Object.keys(result.metafile.inputs);
	const nodeModulePaths = new Set();

	for (const input of inputs) {
		const match = input.match(/^(node_modules\/[^/]+)/);
		if (match) {
			const moduleName = match[1];
			const packageName = moduleName.replace(/\\/g, '/');

			// Skip excluded modules
			const name = packageName.replace('node_modules/', '');
			if (skipIds.includes(name)) continue;

			nodeModulePaths.add(packageName);
		}
	}

	// Sort and format as file entries
	const lines = [...nodeModulePaths].sort().map(it => ({
		from: it,
		to: it,
	}));

	console.log('Detected runtime dependencies:', lines.length);
	lines.forEach(l => console.log('  ', l.from));

	// Read base deps and package.json
	const baseDepsFile = fs.readFileSync(path.resolve(__dirname, '..', 'package.deps.json'), 'utf8');
	const baseDepsJSON = JSON.parse(baseDepsFile);

	const packageFile = fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), 'utf8');
	const packageJSON = JSON.parse(packageFile);

	// Merge and write
	packageJSON.build.files = baseDepsJSON.concat(lines);
	const jsonS = JSON.stringify(packageJSON, null, '\t');
	fs.writeFileSync(path.resolve(__dirname, '..', 'package.json'), jsonS);

	console.log('Updated package.json build.files with', packageJSON.build.files.length, 'entries');
}

main().catch(err => {
	console.error('Error analyzing dependencies:', err);
	process.exit(1);
});
