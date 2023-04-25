import Struct from 'google-protobuf/google/protobuf/struct_pb.js';

export class Encode {

	static encodeStruct (obj: any) {
		if (typeof obj === 'undefined') {
			obj = null;
		};
		return Struct.Struct.fromJavaScript(obj);
	};

	static encodeValue (value: any) {
		if (typeof value === 'undefined') {
			value = null;
		};
		return Struct.Value.fromJavaScript(value);
	};
	
};

export class Decode {

	static decodeValue (value: any) {
		let data = null;
		try { data = value ? value.toJavaScript() : null; } catch (e) { /**/ };
		return data;
	};

	static decodeStruct (struct: any) {
		let data = {};
		try { data = struct ? struct.toJavaScript() : {}; } catch (e) { /**/ };
		return data;
	};

};