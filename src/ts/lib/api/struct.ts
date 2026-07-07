/**
 * Struct/Value encoding/decoding for protobuf.
 *
 * With ts-proto bindings, Struct and Value fields are represented as plain JS objects.
 * The encode/decode functions are now identity operations, but we keep the API
 * for backward compatibility with callers that use Encode.struct() / Decode.struct().
 */

/**
 * Coerce `undefined` to `null` at any depth (protobuf Struct/Value cannot represent
 * `undefined`, and the middleware distinguishes an explicit null from an absent field).
 * Copy-on-write: the input is never mutated, and no copies are allocated unless a
 * value actually needs coercion — the common case passes through reference-equal.
 */
const prepare = (o: any) => {
	if (typeof o === 'undefined') {
		return null;
	};
	if (!o || (typeof o !== 'object')) {
		return o;
	};

	let ret = o;

	if (Array.isArray(o)) {
		for (let i = 0; i < o.length; i++) {
			const p = prepare(o[i]);
			if (p !== o[i]) {
				if (ret === o) {
					ret = o.slice();
				};
				ret[i] = p;
			};
		};
	} else {
		for (const k in o) {
			const p = prepare(o[k]);
			if (p !== o[k]) {
				if (ret === o) {
					ret = { ...o };
				};
				ret[k] = p;
			};
		};
	};
	return ret;
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
