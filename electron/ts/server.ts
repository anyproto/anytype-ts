import path from 'path';
import childProcess from 'child_process';
import fs from 'fs';
import { app, dialog, shell } from 'electron';
import Util from './util';

const stdoutWebProxyPrefix = 'gRPC Web proxy started at: ';
const winShutdownStdinMessage = 'shutdown\n';
const parentLifelineEnv = 'ANYTYPE_PARENT_LIFELINE';
const parentLifelineStdin = 'stdin';
// Once the lifeline reports the owner is gone, the helper arms its own 10s
// hard-exit deadline, so leave room for that path to win and keep SIGKILL a
// last resort. The POSIX signal path has no deadline on the helper side,
// which is what this timer really guards against.
const gracefulShutdownTimeoutMs = 12000;
const forceShutdownTimeoutMs = 5000;

let maxStdErrChunksBuffer = 10;

export class Server {

	cp: childProcess.ChildProcess | null = null;
	address: string = '';
	isRunning: boolean = false;
	stopTriggered: boolean = false;
	stopPromise: Promise<boolean> | null = null;
	startPromise: Promise<boolean> | null = null;
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
		if (this.startPromise) {
			return this.startPromise;
		};

		console.log('[Server]: start', binPath, workingDir);

		const logPath = Util.logPath();
		const env: NodeJS.ProcessEnv = {
			...process.env,
			// The helper treats EOF on stdin as proof that its Electron main-process
			// owner disappeared. Keep this pipe open for the helper's whole lifetime.
			[parentLifelineEnv]: parentLifelineStdin,
		};

		let ready = false;

		const startPromise = new Promise<boolean>((resolve, reject) => {

			// stop will resolve immediately in case child process is not running
			this.stop().then((stopped) => {
				if (!stopped) {
					const err = new Error('Failed to stop the previous Anytype helper process');

					this.readyReject?.(err);
					reject(err);
					return;
				};

				this.isRunning = false;
				this.stopTriggered = false;

				try {
					if (!process.stdout.isTTY) {
						env['GOLOG_FILE'] = path.join(logPath, `anytype_${Util.dateForFile()}.log`);
					};

					this.cp = childProcess.spawn(binPath, [ '127.0.0.1:0', '127.0.0.1:0' ], {
						windowsHide: false,
						env,
						stdio: [ 'pipe', 'pipe', 'pipe' ],
					});
				} catch (err: any) {
					console.error('[Server] Process start error: ', err.toString());
					this.readyReject?.(err);
					reject(err);
					return;
				};

				const cp = this.cp;

				cp.on('error', (err: any) => {
					if (this.cp !== cp) {
						return;
					};

					this.isRunning = false;
					console.error('[Server] Failed to start server: ', err.toString());
					this.readyReject?.(err);
					reject(err);
				});

				cp.stdout.on('data', (data: Buffer) => {
					// Node flushes buffered output after exit; ignore a dead helper's
					// late ready line so it cannot publish a stale address
					if (this.cp !== cp) {
						return;
					};

					const str = data.toString();

					if (!this.isRunning && str && (str.indexOf(stdoutWebProxyPrefix) >= 0)) {
						const regex = new RegExp(stdoutWebProxyPrefix + '([^\n^\s]+)');

						this.address = 'http://' + regex.exec(str)[1];
						this.isRunning = true;

						ready = true;
						this.readyResolve?.(this.address);
						resolve(true);
					};

					// Do not delete
					console.log(str);
				});

				cp.stderr.on('data', (data: Buffer) => {
					if (this.cp !== cp) {
						return;
					};

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

				cp.on('exit', () => {
					if (this.cp !== cp) {
						return;
					};

					this.cp = null;
					this.isRunning = false;

					// The helper died before it reported readiness: settle start() so
					// callers awaiting it are never left pending
					if (!ready) {
						ready = true;

						if (this.stopTriggered) {
							resolve(false);
						} else {
							const err = new Error('Anytype helper exited before it was ready');

							this.readyReject?.(err);
							reject(err);
						};
					};

					if (this.stopTriggered) {
						return;
					};

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

		this.startPromise = startPromise;

		// Registered before the promise is handed out so the slot is released
		// before any caller awaiting start() resumes
		const release = () => {
			if (this.startPromise === startPromise) {
				this.startPromise = null;
			};
		};

		void startPromise.then(release, release);

		return startPromise;
	};

	stop (signal?: string): Promise<boolean> {
		signal = String(signal || 'SIGTERM');

		if (this.stopPromise) {
			return this.stopPromise;
		};

		const cp = this.cp;
		if (!cp || (cp.exitCode !== null) || (cp.signalCode !== null)) {
			this.isRunning = false;
			if (this.cp === cp) {
				this.cp = null;
			};
			return Promise.resolve(true);
		};

		this.stopTriggered = true;

		const stopPromise = new Promise<boolean>((resolve) => {
			let finished = false;
			let forceTriggered = false;
			let gracefulTimer: ReturnType<typeof setTimeout> | null = null;
			let forceTimer: ReturnType<typeof setTimeout> | null = null;
			let stdinErrorHandler: ((err: Error) => void) | null = null;

			const finish = (stopped: boolean) => {
				if (finished) {
					return;
				};

				finished = true;
				if (gracefulTimer) {
					clearTimeout(gracefulTimer);
				};
				if (forceTimer) {
					clearTimeout(forceTimer);
				};
				if (cp.stdin && stdinErrorHandler) {
					cp.stdin.removeListener('error', stdinErrorHandler);
				};

				cp.removeListener('exit', onExit);
				if (stopped) {
					this.isRunning = false;
					if (this.cp === cp) {
						this.cp = null;
					};
				};
				resolve(stopped);
			};

			const onExit = () => finish(true);
			const forceStop = () => {
				if (finished || forceTriggered) {
					return;
				};

				forceTriggered = true;
				if (gracefulTimer) {
					clearTimeout(gracefulTimer);
				};

				console.warn(`[Server] Helper did not stop within ${gracefulShutdownTimeoutMs}ms; killing it`);
				try {
					cp.kill('SIGKILL');
				} catch (err: any) {
					console.error('[Server] Failed to kill helper:', err.toString());
				};

				forceTimer = setTimeout(() => {
					console.error(`[Server] Helper did not report exit within ${forceShutdownTimeoutMs}ms after SIGKILL`);
					finish(false);
				}, forceShutdownTimeoutMs);
			};

			cp.once('exit', onExit);
			gracefulTimer = setTimeout(forceStop, gracefulShutdownTimeoutMs);

			try {
				if (process.platform === 'win32') {
					// Windows does not support POSIX termination signals. The helper's
					// stdin protocol requests a graceful shutdown instead.
					if (!cp.stdin) {
						forceStop();
					} else {
						stdinErrorHandler = (err: Error) => {
							console.error('[Server] Failed to request helper shutdown:', err.toString());
							forceStop();
						};
						cp.stdin.once('error', stdinErrorHandler);
						cp.stdin.write(winShutdownStdinMessage, (err) => {
							if (err) {
								stdinErrorHandler?.(err);
							};
						});
					};
				} else
				if (!cp.kill(signal as NodeJS.Signals)) {
					forceStop();
				};
			} catch (err: any) {
				console.error('[Server] Failed to request helper shutdown:', err.toString());
				forceStop();
			};
		});

		this.stopPromise = stopPromise;
		void stopPromise.then(() => {
			if (this.stopPromise === stopPromise) {
				this.stopPromise = null;
			};
		});

		return stopPromise;
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
