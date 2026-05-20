#!/usr/bin/env node
'use strict';

/**
 * Analyzes electron.js dependencies using esbuild to determine which
 * node_modules are needed at runtime for ASAR packaging.
 *
 * After detecting direct imports via esbuild's metafile, it recursively
 * resolves all transitive dependencies by reading each package's package.json.
 * This ensures packages like mime-db (dep of mime-types) are included
 * automatically without manual listing.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const nodeModulesDir = path.join(rootDir, 'node_modules');
const skipIds = new Set(['electron']);

/**
 * Recursively collects all transitive dependencies of a package.
 */
function collectTransitiveDeps(packageName, collected) {
	if (collected.has(packageName) || skipIds.has(packageName)) {
		return;
	}

	// Resolve the package directory — handle scoped packages
	const pkgDir = path.join(nodeModulesDir, packageName);
	const pkgJsonPath = path.join(pkgDir, 'package.json');

	if (!fs.existsSync(pkgJsonPath)) {
		return;
	}

	collected.add(packageName);

	try {
		const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
		const deps = pkgJson.dependencies || {};

		for (const dep of Object.keys(deps)) {
			collectTransitiveDeps(dep, collected);
		}
	} catch (e) {
		// If we can't read the package.json, just include the package itself
	}
}

async function main() {
	// esbuild is bundled with Vite, so it's always available
	const esbuild = require('esbuild');

	const result = await esbuild.build({
		entryPoints: [path.resolve(rootDir, 'electron.js')],
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

	// Extract top-level package names from metafile inputs
	const inputs = Object.keys(result.metafile.inputs);
	const directDeps = new Set();

	for (const input of inputs) {
		// Handle both regular and scoped packages (e.g., @electron/remote)
		const match = input.match(/^node_modules\/((?:@[^/]+\/)?[^/]+)/);
		if (match) {
			const name = match[1];
			if (!skipIds.has(name)) {
				directDeps.add(name);
			}
		}
	}

	console.log('Direct dependencies from esbuild:', directDeps.size);

	// Read base deps (package.deps.json) to get manually specified packages
	const baseDepsFile = fs.readFileSync(path.resolve(rootDir, 'package.deps.json'), 'utf8');
	const baseDepsJSON = JSON.parse(baseDepsFile);

	// Extract package names from manual dep entries (skip glob patterns/strings)
	const manualDeps = new Set();
	for (const entry of baseDepsJSON) {
		if (typeof entry === 'object' && entry.from) {
			const match = entry.from.match(/^node_modules\/((?:@[^/]+\/)?[^/]+)/);
			if (match) {
				manualDeps.add(match[1]);
			}
		}
	}

	console.log('Manual dependencies from package.deps.json:', manualDeps.size);

	// Combine direct + manual deps, then resolve all transitive dependencies
	const allRootDeps = new Set([...directDeps, ...manualDeps]);
	const allDeps = new Set();

	for (const dep of allRootDeps) {
		collectTransitiveDeps(dep, allDeps);
	}

	console.log('Total dependencies (including transitive):', allDeps.size);

	// Sort and format as file entries
	const depEntries = [...allDeps].sort().map(name => ({
		from: `node_modules/${name}`,
		to: `node_modules/${name}`,
	}));

	// Keep non-node_modules entries from package.deps.json (globs, paths)
	const staticEntries = baseDepsJSON.filter(entry => typeof entry === 'string');

	// Read package.json and update build.files
	const packageFile = fs.readFileSync(path.resolve(rootDir, 'package.json'), 'utf8');
	const packageJSON = JSON.parse(packageFile);

	packageJSON.build.files = staticEntries.concat(depEntries);
	const jsonS = JSON.stringify(packageJSON, null, '\t');
	fs.writeFileSync(path.resolve(rootDir, 'package.json'), jsonS);

	console.log('Updated package.json build.files with', packageJSON.build.files.length, 'entries');
	depEntries.forEach(l => console.log('  ', l.from));
}

main().catch(err => {
	console.error('Error analyzing dependencies:', err);
	process.exit(1);
});
