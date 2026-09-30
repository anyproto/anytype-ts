/** JSON values with number lexemes intact, including values outside JS number precision. */
export type JsonValue =
	| { kind: 'object'; entries: [string, JsonValue][] }
	| { kind: 'array'; values: JsonValue[] }
	| { kind: 'string'; value: string }
	| { kind: 'number'; value: string }
	| { kind: 'boolean'; value: boolean }
	| { kind: 'null' };

export function parseJson (source: string): JsonValue {
	// Let the native parser validate grammar. Its rounded numbers are deliberately discarded.
	JSON.parse(source);
	const tokens = source.match(/"(?:\\[\s\S]|[^"\\])*"|[{}\[\],:]|[^\s{}\[\],:]+/g) || [];
	let offset = 0;
	const read = (depth: number): JsonValue => {
		if (depth > 128) {
			throw new Error('JSON nesting exceeds 128 levels');
		};
		const token = tokens[offset++];
		if (token == '{') {
			const fields = new Map<string, JsonValue>();
			while (tokens[offset] != '}') {
				const key = JSON.parse(tokens[offset++]);
				offset++; // colon
				fields.set(key, read(depth + 1));
				if (tokens[offset] != ',') break;
				offset++;
			};
			offset++;
			return { kind: 'object', entries: Array.from(fields) };
		};
		if (token == '[') {
			const values: JsonValue[] = [];
			while (tokens[offset] != ']') {
				values.push(read(depth + 1));
				if (tokens[offset] != ',') break;
				offset++;
			};
			offset++;
			return { kind: 'array', values };
		};
		if (token[0] == '"') return { kind: 'string', value: JSON.parse(token) };
		if (token == 'null') return { kind: 'null' };
		if ((token == 'true') || (token == 'false')) return { kind: 'boolean', value: token == 'true' };
		return { kind: 'number', value: token };
	};
	return read(0);
};

export function jsonStringify (value: JsonValue, pretty = false, canonical = false, depth = 0): string {
	if (value.kind == 'null') return 'null';
	if (value.kind == 'number') return value.value;
	if ((value.kind == 'string') || (value.kind == 'boolean')) return JSON.stringify(value.value);
	const isObject = value.kind == 'object';
	const entries = isObject ? [ ...value.entries ] : [];
	if (canonical) entries.sort(([ a ], [ b ]) => a < b ? -1 : a > b ? 1 : 0);
	const parts = isObject
		? entries.map(([ key, child ]) => JSON.stringify(key) + (pretty ? ': ' : ':') + jsonStringify(child, pretty, canonical, depth + 1))
		: value.values.map(child => jsonStringify(child, pretty, canonical, depth + 1));
	const open = isObject ? '{' : '[';
	const close = isObject ? '}' : ']';
	if (!pretty || !parts.length) return open + parts.join(',') + close;
	const indent = '  '.repeat(depth + 1);
	return open + '\n' + indent + parts.join(',\n' + indent) + '\n' + '  '.repeat(depth) + close;
};

export function jsonField (value: JsonValue, key: string): JsonValue | undefined {
	return value?.kind == 'object' ? value.entries.find(([ name ]) => name == key)?.[1] : undefined;
};

export function jsonText (value: JsonValue): string {
	return value?.kind == 'string' ? value.value : '';
};

export function jsonHasData (value: JsonValue): boolean {
	if (!value || (value.kind == 'null')) return false;
	if (value.kind == 'object') return !!value.entries.length;
	if (value.kind == 'array') return !!value.values.length;
	if (value.kind == 'string') return !!value.value.length;
	return true;
};

export function jsonMerge (previous: JsonValue, patch: JsonValue): JsonValue {
	if ((previous.kind != 'object') || (patch.kind != 'object')) return patch;
	const fields = new Map(previous.entries);
	patch.entries.forEach(([ key, value ]) => fields.set(key, value));
	return { kind: 'object', entries: Array.from(fields) };
};

export function jsonMetadata (value: JsonValue): JsonValue {
	return value.kind == 'object' ? { kind: 'object', entries: value.entries.filter(([ key ]) => key != 'result') } : value;
};
