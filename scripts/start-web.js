#!/usr/bin/env node
'use strict';

const childProcess = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const stdoutWebProxyPrefix = 'gRPC Web proxy started at: ';
const winShutdownStdinMessage = 'shutdown\n';

const webPort = process.env.WEB_PORT || 9090;
const openBrowserAuto = process.env.WEB_OPEN_BROWSER === '1' || process.env.WEB_OPEN_BROWSER === 'true';

// Use the same Application Support / AppData folder as Electron
function getDefaultDataPath() {
	const platform = process.platform;

	if (platform === 'darwin') {
		// macOS: ~/Library/Application Support/anytype/data
		return path.join(os.homedir(), 'Library', 'Application Support', 'anytype', 'data');
	} else if (platform === 'win32') {
		// Windows: %APPDATA%/anytype/data
		return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'anytype', 'data');
	} else {
		// Linux: ~/.config/anytype/data
		return path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'anytype', 'data');
	}
}

const dataPath = process.env.WEB_DATA_PATH || getDefaultDataPath();

let helperProcess = null;
let rspackProcess = null;

// Ensure data directory exists
if (!fs.existsSync(dataPath)) {
	fs.mkdirSync(dataPath, { recursive: true });
}

const HELPER_STARTUP_TIMEOUT_MS = 30000;

function startHelper() {
	return new Promise((resolve, reject) => {
		const sideServer = process.env.ANYTYPE_USE_SIDE_SERVER;

		if (sideServer) {
			console.log(`[Web] Using external server: ${sideServer}`);
			resolve(sideServer);
			return;
		}

		let binPath = path.join(__dirname, '..', 'dist', 'anytypeHelper');

		// Handle Windows executable extension
		if (process.platform === 'win32' && !fs.existsSync(binPath)) {
			binPath += '.exe';
		}

		if (!fs.existsSync(binPath)) {
			console.error(`[Web] Error: anytypeHelper not found at ${binPath}`);
			console.error('[Web] Run ./update.sh to download the middleware first');
			process.exit(1);
		}

		console.log('[Web] Starting anytypeHelper...');

		let resolved = false;
		let timeoutId = null;

		const cleanup = () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
		};

		helperProcess = childProcess.spawn(binPath, ['127.0.0.1:0', '127.0.0.1:0'], {
			windowsHide: false,
			env: process.env,
		});

		// Timeout if helper doesn't start in time
		timeoutId = setTimeout(() => {
			if (!resolved) {
				resolved = true;
				console.error(`[Web] Timeout: anytypeHelper did not start within ${HELPER_STARTUP_TIMEOUT_MS / 1000}s`);
				if (helperProcess) {
					helperProcess.kill('SIGTERM');
				}
				reject(new Error('Helper startup timeout'));
			}
		}, HELPER_STARTUP_TIMEOUT_MS);

		helperProcess.on('error', (err) => {
			cleanup();
			if (!resolved) {
				resolved = true;
				console.error('[Web] Failed to start anytypeHelper:', err.toString());
				reject(err);
			}
		});

		helperProcess.stdout.on('data', (data) => {
			const str = data.toString();
			process.stdout.write(str);

			if (!resolved && str.indexOf(stdoutWebProxyPrefix) >= 0) {
				const regex = new RegExp(stdoutWebProxyPrefix + '([^\\n\\s]+)');
				const match = regex.exec(str);
				if (match) {
					resolved = true;
					cleanup();
					const address = 'http://' + match[1];
					console.log(`[Web] gRPC-web proxy ready at: ${address}`);
					resolve(address);
				}
			}
		});

		helperProcess.stderr.on('data', (data) => {
			process.stderr.write(data.toString());
		});

		helperProcess.on('exit', (code) => {
			cleanup();
			if (!resolved) {
				resolved = true;
				const msg = `anytypeHelper exited unexpectedly with code ${code}`;
				console.error(`[Web] ${msg}`);
				reject(new Error(msg));
			}
			helperProcess = null;
		});
	});
}

function openBrowser(url) {
	const platform = process.platform;
	let cmd;

	if (platform === 'darwin') {
		cmd = 'open';
	} else if (platform === 'win32') {
		cmd = 'start';
	} else {
		cmd = 'xdg-open';
	}

	childProcess.spawn(cmd, [url], {
		detached: true,
		stdio: 'ignore',
		shell: platform === 'win32',
	}).unref();
}

// ANSI color codes
const green = '\x1b[32m';
const reset = '\x1b[0m';

function startRspack(serverAddress) {
	return new Promise((resolve, reject) => {
		const webUrl = `http://127.0.0.1:${webPort}/?server=${encodeURIComponent(serverAddress)}&dataPath=${encodeURIComponent(dataPath)}`;

		console.log(`\n[Web] Web URL: ${green}${webUrl}${reset}\n`);

		// Set env vars for rspack config
		process.env.BUILD_TARGET = 'web';
		process.env.WEB_PORT = webPort;
		process.env.WEB_SERVER_ADDRESS = serverAddress;
		process.env.WEB_DATA_PATH = dataPath;

		const rspackArgs = [
			'serve',
			'--mode=development',
			'--node-env=development',
			'--env', 'target=web',
		];

		rspackProcess = childProcess.spawn('npx', ['rspack', ...rspackArgs], {
			stdio: ['inherit', 'pipe', 'inherit'],
			shell: true,
			env: process.env,
		});

		let browserOpened = false;

		rspackProcess.stdout.on('data', (data) => {
			const str = data.toString();
			process.stdout.write(str);

			// Open browser once webpack is ready
			if (!browserOpened && str.includes('compiled successfully')) {
				browserOpened = true;
				if (openBrowserAuto) {
					console.log(`\n[Web] Opening browser: ${webUrl}\n`);
					openBrowser(webUrl);
				}
			}
		});

		rspackProcess.on('error', (err) => {
			console.error('[Web] Failed to start rspack:', err.toString());
			reject(err);
		});

		rspackProcess.on('exit', (code) => {
			rspackProcess = null;
			if (code !== null && code !== 0) {
				console.error(`[Web] rspack exited with code ${code}`);
			}
			resolve();
		});
	});
}

function cleanup() {
	console.log('\n[Web] Shutting down...');

	if (rspackProcess) {
		rspackProcess.kill('SIGTERM');
	}

	if (helperProcess) {
		if (process.platform === 'win32') {
			helperProcess.stdin.write(winShutdownStdinMessage);
		} else {
			helperProcess.kill('SIGTERM');
		}
	}
}

process.on('SIGINT', () => {
	cleanup();
	process.exit(0);
});

process.on('SIGTERM', () => {
	cleanup();
	process.exit(0);
});

async function main() {
	try {
		console.log('[Web] Anytype Web Mode');
		console.log('[Web] ==================');

		const serverAddress = await startHelper();
		await startRspack(serverAddress);
	} catch (err) {
		console.error('[Web] Error:', err);
		cleanup();
		process.exit(1);
	}
}

main();
