import * as readline from 'readline';
import { spawn } from 'child_process';
import { Event } from 'ts/protocol/event/event.js';

const fs = require('fs');
const FIFO = require('fifo-js');

class FifoPipe {

	goTemp: string = '/var/tmp/.go_pipe';
	jsTemp: string = '/var/tmp/.js_pipe';
	fifo: any;

	constructor () {
		this.makeFifo();
	};

	private makeFifo () {
		/*
		const process = spawn('mkfifo', [ this.jsTemp ]);
		process.on('exit', (status: number) => {
			if (status != 0) {
				throw new Error(`fail to create fifo with code: ${status}`);
				return
			};
			
			console.log('fifo created: ' + this.jsTemp);
			this.fifo = new FIFO(this.jsTemp);
		});
		*/
	};

	public writer (msg: any) {
		let eventMsg = Event.create(msg);
		let encoded = Event.encode(eventMsg).finish();

		let m: string = btoa(encoded.toString());
		this.fifo.write(m);
	};

	public reader (cb: any) {
		let rl = readline.createInterface({
			input: fs.createReadStream(this.goTemp)
		});

		rl.on('line', (line: string) => {
			// b64 -> msg + remove \n at the end
			const msg: string = atob(line.slice(0, -1));
			cb(Event.decode(Buffer.from(msg)));
		});
	};

	public static generateId () {
		let chars: string[] = '0123456789ABCDEF'.split('');
		let len: number = 32;
		let arr: string[] = Array(len).fill(null).map(()=> chars[Math.ceil(Math.random()*chars.length) - 1]);
		return arr.join('');
	};

};

let fifoPipe: FifoPipe = new FifoPipe();
export { FifoPipe, fifoPipe };