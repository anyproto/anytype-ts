import * as is from 'is';

enum KindCase {
	KIND_NOT_SET	 = 0,
	NULL_VALUE		 = 1,
	NUMBER_VALUE	 = 2,
	STRING_VALUE	 = 3,
	BOOL_VALUE		 = 4,
	STRUCT_VALUE	 = 5,
	LIST_VALUE		 = 6,
};

class StructEncode {

	seenObjects: Set<{}>;
	removeCircular: boolean;
	stringify?: boolean;

	constructor (options?: any) {
		options = options || {};

		this.seenObjects = new Set();
		this.removeCircular = options.removeCircular === true;
		this.stringify = options.stringify === true;
	};

	encodeStruct (obj: any) {
		const convertedObject: any = {
			fields: {},
		};

		this.seenObjects.add(obj);

		for (const prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				const value = obj[prop];

				if (is.undefined(value)) {
					continue;
				};

				convertedObject.fields[prop] = this.encodeValue(value);
			};
		};

		this.seenObjects.delete(obj);
		return convertedObject;
	};

	encodeValue (value: any) {
		let convertedValue;

		if (is.null(value)) {
			convertedValue = {
				nullValue: 0,
			};
		} else if (is.number(value)) {
			convertedValue = {
				numberValue: value,
			};
		} else if (is.string(value)) {
			convertedValue = {
				stringValue: value,
			};
		} else if (is.boolean(value)) {
			convertedValue = {
				boolValue: value,
			};
		} else if (Buffer.isBuffer(value)) {
			convertedValue = {
				blobValue: value,
			};
		} else if (is.object(value)) {
			if (this.seenObjects.has(value)) {
				// Circular reference.
				if (!this.removeCircular) {
					throw new Error(
						[
							'This object contains a circular reference. To automatically',
							'remove it, set the `removeCircular` option to true.',
						].join(' ')
					);
				}
				convertedValue = {
					stringValue: '[Circular]',
				};
			} else {
				convertedValue = {
					structValue: this.encodeStruct(value),
				};
			}
		} else if (is.array(value)) {
			convertedValue = {
				listValue: {
					values: value.map(this.encodeValue.bind(this)),
				},
			};
		} else {
			if (!this.stringify) {
				throw new Error('Value of type ' + typeof value + ' not recognized.');
			};

			convertedValue = {
				stringValue: String(value),
			};
		};

		return convertedValue;
	};
};

class StructDecode {

	static decodeValue (value: any) {
		switch (value.kind) {
			case 'structValue': {
				return StructDecode.decodeStruct(value.structValue);
			};

			case 'nullValue': {
				return null;
			};

			case 'listValue': {
				return value.listValue.values.map(StructDecode.decodeValue);
			};

			default: {
				return value[value.kind];
			};
		};
	};

	static decodeStruct (struct: any) {
		const ret: any = {};
		const entries = struct.entries();

		for (let entry of entries) {
			let k = entry[0];
			let value = entry[1];
			let c = value.getKindCase();
			let v: any;

			if (c == KindCase.NULL_VALUE)	 v = value.getNullValue(); 
			if (c == KindCase.NUMBER_VALUE)	 v = value.getNumberValue();
			if (c == KindCase.STRING_VALUE)	 v = value.getStringValue();
			if (c == KindCase.BOOL_VALUE)	 v = value.getBoolValue();
			if (c == KindCase.STRUCT_VALUE)	 v = value.getStructValue();
			if (c == KindCase.LIST_VALUE)	 v = value.getListValue();

			ret[k] = v;
		};

		return ret;
	};

};

export let Encode = new StructEncode();
export let Decode = StructDecode;