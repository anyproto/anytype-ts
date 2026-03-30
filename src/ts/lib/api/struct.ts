/**
 * Struct/Value encoding/decoding for protobuf.
 *
 * With ts-proto bindings, Struct and Value fields are represented as plain JS objects.
 * The encode/decode functions are now identity operations, but we keep the API
 * for backward compatibility with callers that use Encode.struct() / Decode.struct().
 */

const prepare = (o: any) => {
	if (typeof o === 'undefined') {
		o = null;
	} else
	if (typeof o === 'object') {
		for (const k in o) {
			if (typeof o[k] === 'object') {
				o[k] = prepare(o[k]);
			} else
			if (typeof o[k] === 'undefined') {
				o[k] = null;
			};
		};
	};
	return o;
};

export class Encode {

	public static struct (obj: any) {
		return prepare(obj);
	};

	public static value (value: any) {
		return prepare(value);
	};
};

export class Decode {

	public static value (value: any) {
		return value ?? null;
	};

	public static struct (struct: any) {
		return struct ?? {};
	};

};
