const Struct = require('google-protobuf/google/protobuf/struct_pb.js');

export class Encode {

	static encodeStruct (obj: any) {
		return Struct.Struct.fromJavaScript(obj);
	};

	static encodeValue (value: any) {
		return Struct.Value.fromJavaScript(value);
	};
	
};

export class Decode {

	static decodeValue (value: any) {
		return value.toJavaScript();
	};

	static decodeStruct (struct: any) {
		return struct ? struct.toJavaScript() : {};
	};

};