'use strict';
const path = require('path');
const childProcess = require('child_process');
const fs = require('fs');
const stdoutWebProxyPrefix = 'gRPC Web proxy started at: ';
const { app, dialog, shell } = require('electron');

const Util = require('./util.js');
const { sign } = require('crypto');

let maxStdErrChunksBuffer = 10;

class Server {

	start (binPath, workingDir) {
		return new Promise((resolve, reject) => {

			// stop will resolve immediately in case child process is not running
			this.stop().then(() => {
				
				this.isRunning = false;
				const logsDir = path.join(workingDir, 'logs');

				try { fs.mkdirSync(logsDir); } catch (e) {};

				try {
					const env = process.env;
					
					if (!process.stdout.isTTY) {
						env['GOLOG_FILE'] = path.join(logsDir, `anytype_${Util.dateForFile()}.log`);
					};
					
					const args = [ '127.0.0.1:0', '127.0.0.1:0' ];
					this.cp = childProcess.spawn(binPath, args, { env: env });
				} catch (err) {
					console.error('[Server] Process start error: ', err.toString());
					reject(err);
				};
				
				this.cp.on('error', err => {
					this.isRunning = false;
					console.error('[Server] Failed to start server: ', err.toString());
					reject(err);
				});
				
				this.cp.stdout.on('data', data => {
					const str = data.toString();

					if (!this.isRunning && str && (str.indexOf(stdoutWebProxyPrefix) >= 0)) {
						const regex = new RegExp(stdoutWebProxyPrefix + '([^\n^\s]+)');
						this.address = 'http://' + regex.exec(str)[1];
						this.isRunning = true;
						resolve(true);
					};

					console.log(str);
				});

				this.cp.stderr.on('data', data => {
					const chunk = data.toString();
					
					// max chunk size is 8192 bytes
					// https://github.com/nodejs/node/issues/12921
					// https://nodejs.org/api/buffer.html#buffer_class_property_buffer_poolsize
					
					if (chunk.length > 8000) {
						// in case we've got a crash lets change the max buffer to collect the whole stack trace
						maxStdErrChunksBuffer = 1024; // 1024x8192 = 8 Mb max
					};
					
					if (!this.lastErrors) {
						this.lastErrors = [];
					} else if (this.lastErrors.length >= maxStdErrChunksBuffer) {
						this.lastErrors.shift();
					};
					
					this.lastErrors.push(chunk);
					Util.log('warn', chunk);
				});
				
				this.cp.on('exit', () => {
					if (this.stopTriggered) {
						return;
					};
					
					this.isRunning = false;
					
					const crashReport = path.join(logsDir, `crash_${Util.dateForFile()}.log`);
					try {
						fs.writeFileSync(crashReport, this.lastErrors.join('\n'), 'utf-8');
					} catch(e) {
						console.log('failed to save a file');
					};
					
					dialog.showErrorBox('Anytype helper crashed', 'You will be redirected to the crash log file. You can send it to Anytype developers by creating issue at community.anytype.io');
					shell.showItemInFolder(crashReport);
					
					app.exit(0);
				});
			});
		});
	};
	
	stop (signal) {
		signal = String(signal || 'SIGTERM');

		return new Promise((resolve, reject) => {
			if (this.cp && this.isRunning) {
				this.cp.on('exit', () => {
					resolve(true);

					this.isRunning = false;
					this.cp = null;
				});
				
				this.stopTriggered = true;
				this.cp.kill(signal);
			} else {
				resolve();
			};
		});
	};

	getAddress () {
		return this.address;
	};
	
	setAddress (address) {
		this.address = address;
	};
	
};

module.exports = new Server();