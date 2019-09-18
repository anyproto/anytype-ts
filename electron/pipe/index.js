const bindings = require('bindings')('pipe');
const protobuf = require('protobufjs');

class Pipe {
	
	root = null;
	onMessage = null;
	
	constructor (onMessage) {
		this.onMessage = onMessage;
	};
	
	start () {
		bindings.setCallback((item) => {
			if (!this.root) {
				return;
			};
			
			let cmd = this.root.lookupType('anytype.' + item.method);
			let message = null;
			try {
				message = cmd.decode(this.toBuffer(item.data));
				console.log('Got message: %s', message);
			} catch(err) {
				console.log(err);
			};
			
			if (message) {
				this.onMessage(message);
			};
		});
		
		protobuf.load('./electron/proto/service.proto', (err, root) => {
			if (err) {
				throw err;
			};
			
			this.root = root;
		});
	};
	
	write (type, data) {
		if (!this.root) {
			return;
		};
		
		let cmd = this.root.lookupType('anytype.' + type);
		let buffer = cmd.encode(data).finish();
		
		bindings.callMethod(type, this.toArrayBuffer(buffer));
	};
	
	toArrayBuffer (buffer) {
		let arrayBuffer = new ArrayBuffer(buffer.length);
		let view = new Uint8Array(arrayBuffer);
		for (let i = 0; i < buffer.length; ++i) {
			view[i] = buffer[i];
		};
		return arrayBuffer;
	};
	
	toBuffer (arrayBuffer) {
	    let buffer = Buffer.alloc(arrayBuffer.byteLength);
	    let view = new Uint8Array(arrayBuffer);
	    for (let i = 0; i < buffer.length; ++i) {
	    	buffer[i] = view[i];
	    };
	    return buffer;
	};
	
};

module.exports = Pipe;