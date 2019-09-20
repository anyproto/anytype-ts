const bindings = require('bindings')('pipe');
const protobuf = require('protobufjs');

class Pipe {
	
	onMessage = null;
	typeMiddle = null;
	typeClient = null;
	id = 0;
	
	constructor (onMessage) {
		this.onMessage = onMessage;
	};
	
	start () {
		bindings.setCallback((item) => {
			if (!this.typeMiddle) {
				console.error('[Pipe.read] Protocol not loaded');
				return;
			};
			
			let message = null;
			try {
				message = this.typeMiddle.decode(item.data);
			} catch (err) {
				console.error(err);
			};
			
			if (message) {
				console.log('[Pipe.read]', message);
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
		
		let event = { id: (++this.id).toString() };
		event[type] = data;
		
		let buffer = null;
		try {
			buffer = this.typeClient.encode(event).finish();
		} catch (err) {
			console.error(err);
		};
		
		if (buffer) {
			console.log('[Pipe.write]', event);
			bindings.callMethod(type, buffer);		
		};
	};
	
};

module.exports = Pipe;