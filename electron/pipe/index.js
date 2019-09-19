const bindings = require('bindings')('pipe');
const protobuf = require('protobufjs');

class Pipe {
	
	onMessage = null;
	typeMiddle = null;
	typeClient = null;
	
	constructor (onMessage) {
		this.onMessage = onMessage;
	};
	
	start () {
		bindings.setCallback((item) => {
			if (!this.typeMiddle) {
				console.error('[Pipe.message] Protocol not loaded');
				return;
			};
			
			let message = null;
			try {
				message = this.typeMiddle.decode(item.data);
			} catch (e) {
				console.error(e);
			};
			
			if (message) {
				console.log('[Pipe.message] Message:', message);
				this.onMessage(message);
			};
		});
		
		protobuf.load('./electron/proto/protocol.proto', (err, root) => {
			if (err) {
				throw err;
			};
			
			this.typeMiddle = root.lookupType('anytype.Middle');
			this.typeClient = root.lookupType('anytype.Client');
		});
	};
	
	write (type, data) {
		if (!this.typeClient) {
			console.error('[Pipe.write] Protocol not loaded');
			return;
		};
		
		let event = { id: '1', event: {} };
		event[type] = data;
		
		let buffer = null;
		try {
			buffer = this.typeClient.encode(event).finish();
		} catch (e) {
			console.error(e);
		};
		
		if (buffer) {
			bindings.callMethod(type, buffer);			
		};
	};
	
};

module.exports = Pipe;