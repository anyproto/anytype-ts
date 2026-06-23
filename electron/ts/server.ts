import path from 'path';
import childProcess from 'child_process';
import fs from 'fs';
import { app, dialog, shell } from 'electron';
import Util from './util';

const stdoutWebProxyPrefix = 'gRPC Web proxy started at: ';
const winShutdownStdinMessage = 'shutdown\n';

let maxStdErrChunksBuffer = 10;

class Server {

	cp: childProcess.ChildProcess | null = null;
	address: string = '';
	isRunning: boolean = false;
	stopTriggered: boolean = false;
	lastErrors: string[] = [];
	readyResolve: ((address: string) => void) | null = null;
	readyReject: ((err: Error) => void) | null = null;
	readyPromise: Promise<string>;

	constructor () {
		this.readyPromise = new Promise<string>((resolve, reject) => {
			this.readyResolve = resolve;
			this.readyReject = reject;
		});

		// Prevent unhandled rejection warning when the server fails before any
		// renderer has requested the address
		this.readyPromise.catch(() => null);
	};

	/**
	 * Resolves with the gRPC web proxy address once the middleware is up.
	 * Allows windows to be created before the server finishes starting —
	 * the renderer awaits this via Api.getServerAddress.
	 */
	whenReady (): Promise<string> {
		return this.readyPromise;
	};

	start (binPath: string, workingDir: string): Promise<boolean> {
		console.log('[Server]: start', binPath, workingDir);

		const logPath = Util.logPath();
		const env = process.env;

		return new Promise((resolve, reject) => {

			// stop will resolve immediately in case child process is not running
			this.stop().then(() => {
				this.isRunning = false;

				try {
					if (!process.stdout.isTTY) {
						env['GOLOG_FILE'] = path.join(logPath, `anytype_${Util.dateForFile()}.log`);
					};

					this.cp = childProcess.spawn(binPath, [ '127.0.0.1:0', '127.0.0.1:0' ], { windowsHide: false, env });
				} catch (err: any) {
					console.error('[Server] Process start error: ', err.toString());
					this.readyReject?.(err);
					reject(err);
				};

				this.cp.on('error', (err: any) => {
					this.isRunning = false;
					console.error('[Server] Failed to start server: ', err.toString());
					this.readyReject?.(err);
					reject(err);
				});

				this.cp.stdout.on('data', (data: Buffer) => {
					const str = data.toString();

					if (!this.isRunning && str && (str.indexOf(stdoutWebProxyPrefix) >= 0)) {
						const regex = new RegExp(stdoutWebProxyPrefix + '([^\n^\s]+)');

						this.address = 'http://' + regex.exec(str)[1];
						this.isRunning = true;

						this.readyResolve?.(this.address);
						resolve(true);
					};

					// Do not delete
					console.log(str);
				});

				this.cp.stderr.on('data', (data: Buffer) => {
					const chunk = data.toString();

					// max chunk size is 8192 bytes
					// https://github.com/nodejs/node/issues/12921
					// https://nodejs.org/api/buffer.html#buffer_class_property_buffer_poolsize

					if (chunk.length > 8000) {
						// in case we've got a crash lets change the max buffer to collect the whole stack trace
						maxStdErrChunksBuffer = 2048; // 2048x8192 = 16 Mb max
					};

					if (!this.lastErrors) {
						this.lastErrors = [];
					} else
					if (this.lastErrors.length >= maxStdErrChunksBuffer) {
						this.lastErrors.shift();
					};

					this.lastErrors.push(chunk);
					console.log(chunk);
				});

				this.cp.on('exit', () => {
					if (this.stopTriggered) {
						return;
					};

					this.isRunning = false;

					const log = path.join(logPath, `crash_${Util.dateForFile()}.log`);
					try {
						fs.writeFileSync(log, this.lastErrors.join('\n'), 'utf-8');
					} catch(e) {
						console.log('[Server]: Failed to save log file', log);
					};

					dialog.showErrorBox('Anytype helper crashed', 'You will be redirected to the crash log file. You can send it to Anytype developers by creating issue at https://community.anytype.io');
					shell.showItemInFolder(log);

					app.exit(0);
				});
			});
		});
	};

	stop (signal?: string): Promise<boolean> {
		signal = String(signal || 'SIGTERM');

		return new Promise((resolve, reject) => {
			if (this.cp && this.isRunning) {
				this.cp.on('exit', () => {
					resolve(true);

					this.isRunning = false;
					this.cp = null;
				});

				this.stopTriggered = true;
 				if (process.platform === 'win32') {
					 // it is not possible to handle os signals on windows, so we can't do graceful shutdown on go side
					this.cp.stdin.write(winShutdownStdinMessage);
				} else {
					this.cp.kill(signal as NodeJS.Signals);
				};
			} else {
				resolve(true);
			};
		});
	};

	getAddress (): string {
		return this.address;
	};

	setAddress (address: string): void {
		this.address = address;
		this.readyResolve?.(address);
	};

};

export default new Server();
