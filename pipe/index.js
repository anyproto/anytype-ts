'use strict';

const readline = require('readline');
const childProcess = require('child_process');
const fs = require('fs');
const FIFO = require('fifo-js');
const { Event } = require('./protocol/event/event.js');

const JS_TMP = '/var/tmp/.js_pipe';
const GO_TMP = '/var/tmp/.go_pipe';

class Pipe {
	
	constructor () {
		this.cp = null;
		this.fifo = null;
	};
	
	start () {
		this.stop();
		
		this.cp = childProcess.spawn('mkfifo', [ JS_TMP ]);
		
		this.cp.on('exit', (code, signal) => {
			if (code != 0) {
				throw new Error(`Fail to create fifo with code: ${code} signal: ${signal}`);
				return;
			};
			
			console.log('Fifo created: ' + JS_TMP);
			this.fifo = new FIFO(JS_TMP);
		});
		
		return this;
	};
	
	stop () {
		if (this.cp) {
			this.cp.kill();
		};
		
		childProcess.exec('rm -rf ' + JS_TMP);
	};
	
	write (msg) {
		let eventMsg = Event.create(msg);
		let encoded = Event.encode(eventMsg).finish();

		this.fifo.write(btoa(encoded.toString()));
		
		console.log('Pipe.write', msg);
	};

	read (cb) {
		let rl = readline.createInterface({ input: fs.createReadStream(GO_TMP) });

		rl.on('line', (line) => {
			// b64 -> msg + remove \n at the end
			const msg = atob(line.slice(0, -1));
			cb(Event.decode(Buffer.from(msg)));
			
			console.log('Pipe.read', msg);
		});
	};

	generateId () {
		let chars = '0123456789ABCDEF'.split('');
		let len = 32;
		let arr = Array(len).fill(null).map(() => chars[ Math.ceil(Math.random() * chars.length) - 1 ]);
		return arr.join('');
	};
	
};

module.exports = new Pipe();