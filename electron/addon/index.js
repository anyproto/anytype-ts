const bindings = require('bindings')('addon');
const protobuf = require('protobufjs');

class Pipe {
	
	GenerateMnemonicMessage = null;
	PrintMnemonicMessage = null;
	
	start () {
		bindings.setCallback((item) => {
			try {
				let message = this.PrintMnemonicMessage.decode(this.toBuffer(item.data));
				console.log("got mnemonic: %s", message.mnemonic);
			} catch(err) {
				console.log(err);
			};
		});
		
		protobuf.load('./electron/proto/service.proto', (err, root) => {
			if (err) {
				throw err;
			};
			
			this.GenerateMnemonicMessage = root.lookupType('anytype.GenerateMnemonic');
			this.PrintMnemonicMessage = root.lookupType('anytype.PrintMnemonic');
			
			var hex = 'AA5504B10000B5';
			var buffer = this.GenerateMnemonicMessage.encode({ wordsCount: 12 }).finish();
			
			console.log("---", buffer.toString('hex'));
			bindings.callMethod('GenerateMnemonic', this.toArrayBuffer(buffer));
		});
	};
	
	stop () {
		
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
		let buffer = new Buffer(arrayBuffer.byteLength);
		let view = new Uint8Array(arrayBuffer);
		for (let i = 0; i < buffer.length; ++i) {
			buffer[i] = view[i];
		};
		return buffer;
	};
	
};

module.exports = Pipe;