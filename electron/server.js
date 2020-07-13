'use strict';
const path = require('path');
const childProcess = require('child_process');
const electron = require('electron');
const fs = require('fs');
const stdoutWebProxyPrefix = 'gRPC Web proxy started at: ';

function dateForFile() {
	return new Date().toISOString().replace(/:/g, '_').replace(/\..+/, '');
};

class Server {

	start (binPath, workingDir) {
		return new Promise((resolve, reject) => {
			if (this.cp) {
				this.stop();
			};
			
			this.isRunning = false;

			let logsDir = path.join(workingDir, 'logs');
			
			try {
				fs.mkdirSync(logsDir);
			} catch (err) {};

			try {
				let env = process.env;
				
				if (!process.stdout.isTTY) {
					env['GOLOG_FILE'] = path.join(logsDir, 'anytype_' + dateForFile() + '.log');
				};
				
				let args = [ '127.0.0.1:0', '127.0.0.1:0' ];
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
				let str = data.toString();
				if (!this.isRunning && str && (str.indexOf(stdoutWebProxyPrefix) >= 0)) {
					var regex = new RegExp(stdoutWebProxyPrefix + '([^\n^\s]+)');
					this.address = 'http://' + regex.exec(str)[1];
					this.isRunning = true;
					resolve(true);
				};
				console.log(str);
			});
			
			this.cp.stderr.on('data', data => {
				if (!this.lastErrors) {
					this.lastErrors = [];
				} else
				if (this.lastErrors.length >= 10) {
					this.lastErrors.shift();
				};

				this.lastErrors.push(data);
				console.error(data.toString());
			});
			
			this.cp.on('exit', () => {
				if (this.isKillingPreviousHelper || !this.isRunning) {
					return;
				};
				
				this.isRunning = false;
				
				let crashReport = path.join(logsDir, 'crash_' + dateForFile() + '.log');
				try {
					fs.writeFileSync(crashReport, this.lastErrors.join('\n'), 'utf-8');
				} catch(e) {
					console.log('failed to save a file');
				};
				
				electron.dialog.showErrorBox('Anytype helper crashed', 'You will be redirected to the crash log file. You can send it to Anytype developers: dev@anytype.io');
				electron.shell.showItemInFolder(crashReport);

				electron.app.relaunch();
				electron.app.exit(0);
			});
		});
	};
	
	stop () {
		this.isRunning = false;
		
		// It's sometimes undefined when we do Cmd+R during development.
		// Just safeguarding it here to reduce the terminal noise.
		if (this.cp) {
			this.cp.kill('SIGTERM');
		};
		
		this.cp = null;
	};
	
	getAddress () {
		return this.address;
	};
	
	setAddress (address) {
		this.address = address;
	};
	
};

module.exports = new Server();
