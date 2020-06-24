const Struct = require('google-protobuf/google/protobuf/struct_pb.js');

class StructEncode {

	static encodeStruct (obj: any) {
		return Struct.Struct.fromJavaScript(obj);
	};

	static encodeValue (value: any) {
		return Struct.Value.fromJavaScript(value);
	};
	
};

class StructDecode {

	static decodeValue (value: any) {
		return value.toJavaScript();
	};

	static decodeStruct (struct: any) {
		return struct ? struct.toJavaScript() : {};
	};

};

export let Encode = StructEncode;
export let Decode = StructDecode;