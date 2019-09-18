const bindings = require( 'bindings' )( 'addon' );
var protobuf = require( "protobufjs" );
var SegfaultHandler = require( 'segfault-handler' );

SegfaultHandler.registerHandler( "crash.log" );
var GenerateMnemonicMessage;
var PrintMnemonicMessage;
function buf2hex(buffer) { // buffer is an ArrayBuffer
	return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

bindings.setCallback( item => {
	//console.log("go from go: "+buf2hex(item.data));
//	var message = GenerateMnemonicMessage.decode( item.data );
	try {
		var message = PrintMnemonicMessage.decode( toBuffer(item.data) );
		console.log("got mnemonic: %s", message.mnemonic);
	}
	catch(err) {
		console.log(err);
	}

	/* // Answer the call with a 90% probability of returning true somewhere between
	 // 200 and 400 ms from now.
	 setTimeout(() => {
	   const theAnswer = (Math.random() > 0.1);
	   console.log(thePrime + ': answering with ' + theAnswer);
	   bindings.registerReturnValue(item, theAnswer);
	 }, Math.random() * 200 + 200);*/
} );

function ab2str(buf){
	return String.fromCharCode.apply( null, new Uint8Array( buf ) );
}

function str2ab(str){
	var buf = new ArrayBuffer( str.length ); // 1 bytes for each char
	var bufView = new Uint8Array( buf );
	for (var i = 0, strLen = str.length; i < strLen; i++) {
		bufView[i] = str.charCodeAt( i );
	}
	return buf;
}
