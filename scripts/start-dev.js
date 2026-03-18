#!/usr/bin/env node
'use strict';

const childProcess = require('child_process');
const http = require('http');

const port = parseInt(process.env.SERVER_PORT || '8080', 10);
const isWindows = process.platform === 'win32';

let viteProcess = null;
let electronProcess = null;

function startVite () {
	return new Promise((resolve, reject) => {
		viteProcess = childProcess.spawn('bunx', [ 'vite', '--config', 'vite.config.ts', '--port', String(port) ], {
			stdio: 'inherit',
			shell: true,
			env: process.env,
		});

		viteProcess.on('error', (err) => {
			console.error('[Dev] Failed to start vite:', err.toString());
			reject(err);
		});

		viteProcess.on('exit', (code) => {
			viteProcess = null;

			if (!electronProcess) {
				process.exit(code || 0);
			};
		});

		waitForLocalhost(port).then(resolve).catch(reject);
	});
};

function waitForLocalhost (port) {
	const interval = 500;
	const timeout = 60000;
	const start = Date.now();

	return new Promise((resolve, reject) => {
		function check () {
			if ((Date.now() - start) > timeout) {
				reject(new Error(`[Dev] Timeout waiting for localhost:${port}`));
				return;
			};

			const req = http.request({ hostname: 'localhost', port, method: 'HEAD', path: '/', timeout: 1000 }, () => {
				resolve();
			});

			req.on('error', () => setTimeout(check, interval));
			req.on('timeout', () => { req.destroy(); setTimeout(check, interval); });
			req.end();
		};

		check();
	});
};

function startElectron () {
	const args = isWindows ? [ 'electron.cmd', '.' ] : [ 'electron', '.' ];

	electronProcess = childProcess.spawn('bunx', args, {
		stdio: 'inherit',
		shell: true,
		env: process.env,
	});

	electronProcess.on('error', (err) => {
		console.error('[Dev] Failed to start electron:', err.toString());
	});

	electronProcess.on('exit', (code) => {
		electronProcess = null;
		cleanup();
		process.exit(code || 0);
	});
};

function cleanup () {
	if (viteProcess) {
		viteProcess.kill('SIGTERM');
		viteProcess = null;
	};

	if (electronProcess) {
		electronProcess.kill('SIGTERM');
		electronProcess = null;
	};
};

process.on('SIGINT', () => {
	cleanup();
	process.exit(0);
});

process.on('SIGTERM', () => {
	cleanup();
	process.exit(0);
});

process.on('exit', () => {
	cleanup();
});

async function main () {
	try {
		console.log('[Dev] Starting Vite dev server on port', port);
		await startVite();

		console.log('[Dev] Vite ready, starting Electron');
		startElectron();
	} catch (err) {
		console.error('[Dev] Error:', err);
		cleanup();
		process.exit(1);
	};
};

main();
