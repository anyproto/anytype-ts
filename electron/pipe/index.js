const bindings = require('bindings')('pipe');
const protobuf = require('protobufjs');

class Pipe {
	
	GenerateMnemonicMessage = null;
	PrintMnemonicMessage = null;
	onMessage = null;
	
	constructor (onMessage) {
		this.onMessage = onMessage;
	};
	
	start () {
		bindings.setCallback((item) => {
			let message = null;
			try {
				message = this.PrintMnemonicMessage.decode(this.toBuffer(item.data));
				console.log('Got mnemonic: %s', message.mnemonic);
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
			
			this.GenerateMnemonicMessage = root.lookupType('anytype.GenerateMnemonic');
			this.PrintMnemonicMessage = root.lookupType('anytype.PrintMnemonic');
			
			let buffer = this.GenerateMnemonicMessage.encode({ wordsCount: 12 }).finish();
			bindings.callMethod('GenerateMnemonic', this.toArrayBuffer(buffer));
		});
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