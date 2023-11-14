import Struct from 'google-protobuf/google/protobuf/struct_pb.js';

export class Encode {

	public static struct (obj: any) {
		return Struct.Struct.fromJavaScript(this.prepare(obj));
	};

	public static value (value: any) {
		return Struct.Value.fromJavaScript(this.prepare(value));
	};

	private static prepare (o: any) {
		if (typeof o === 'undefined') {
			o = null;
		} else 
		if (typeof o === 'object') {
			for (const k in o) {
				if (typeof o[k] === 'object') {
					o[k] = this.prepare(o[k]);
				} else 
				if (typeof o[k] === 'undefined') {
					o[k] = null;
				};
			};
		};
		return o;
	};
	
};

export class Decode {

	public static value (value: any) {
		let data = null;
		try { data = value ? value.toJavaScript() : null; } catch (e) { /**/ };
		return data;
	};

	public static struct (struct: any) {
		let data = {};
		try { data = struct ? struct.toJavaScript() : {}; } catch (e) { /**/ };
		return data;
	};

};