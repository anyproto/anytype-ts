import { describe, expect, test } from 'vitest';
import { canonicalDigest, getJsonPath, mutationOnly, readJson, removeJsonPath, setIn, setJsonPath } from './jsonFile';

const PATH = [ 'mcpServers', 'anytype' ];
const ENTRY = { url: 'http://127.0.0.1:31009/mcp/large', headers: { Authorization: 'Bearer <KEY>' } };

const set = (text: string | null) => {
	const res = setJsonPath(text, PATH, ENTRY);

	if ('category' in res) {
		throw new Error(res.category);
	};
	return res.text;
};

const install = (doc: any) => setIn(doc, PATH, ENTRY);
const uninstall = (doc: any) => setIn(doc, PATH, undefined);

describe('readJson', () => {
	test('null or blank is an empty object; the root must be an object', () => {
		expect(readJson(null)).toEqual({ value: {} });
		expect(readJson('  \n')).toEqual({ value: {} });
		expect(readJson('[]')).toEqual({ error: true });
		expect(readJson('"x"')).toEqual({ error: true });
		expect(readJson('{ "a": ')).toEqual({ error: true });
		expect(readJson('{ // c\n "a": 1, }')).toEqual({ value: { a: 1 } });
	});
});

describe('setJsonPath', () => {
	test('a first install into a missing file passes mutationOnly', () => {
		const out = set(null);

		expect(JSON.parse(out)).toEqual({ mcpServers: { anytype: ENTRY } });
		expect(out.endsWith('\n')).toBe(true);
		expect(out).toContain('\n  "mcpServers"');
		expect(mutationOnly(null, out, install)).toBe(true);
	});

	test('a first install into {} passes mutationOnly', () => {
		const out = set('{}');

		expect(mutationOnly('{}', out, install)).toBe(true);
	});

	test('comments, trailing commas and other servers are kept; indentation follows the file', () => {
		const text = '{\n\t// my servers\n\t"mcpServers": {\n\t\t// keep\n\t\t"other": { "command": "x" },\n\t},\n\t"theme": "dark",\n}\n';
		const out = set(text);

		expect(out).toContain('// my servers');
		expect(out).toContain('\t\t// keep\n\t\t"other": { "command": "x" },');
		expect(out).toContain('\t"theme": "dark",\n}');
		expect(out).toContain('\t\t"anytype": {');
		expect(getJsonPath(out, [ 'mcpServers', 'other' ])).toEqual({ command: 'x' });
		expect(mutationOnly(text, out, install)).toBe(true);
	});

	test('a comment on the insertion\'s line refuses the edit (J8); one-line siblings and compact files keep every other byte', () => {
		for (const text of [
			'{\n\t"mcpServers": {\n\t\t"other": { "command": "x" }, // keep\n\t},\n}\n',
			'{\n  "mcpServers": {\n    "other": {\n      "command": "x"\n    } // keep\n  }\n}\n',
		]) {
			expect(setJsonPath(text, PATH, ENTRY)).toEqual({ ok: false, category: 'unsupportedForm' });
		};

		// Pure insertions: the input is the output with our member taken out, byte for byte
		const oneLine = '{\n  "mcpServers": {\n    "other": { "command": "x" }\n  }\n}\n';
		const compact = '{"model":"local","mcpServers":{"other":{"command":"x"}}}';

		for (const text of [ oneLine, compact ]) {
			const out = (setJsonPath(text, PATH, ENTRY) as any).text;

			expect(getJsonPath(out, PATH)).toEqual(ENTRY);
			expect((removeJsonPath(out, PATH) as any).text.replace(/\s+(?=[}\]])/g, '')).toBe(text.replace(/\s+(?=[}\]])/g, ''));
			expect(out.startsWith(text.slice(0, text.indexOf('}') + 1))).toBe(true);
		};
	});

	test('an existing entry is replaced in place', () => {
		const text = '{\n  "mcpServers": {\n    "anytype": { "url": "old" },\n    "other": {}\n  }\n}\n';
		const out = set(text);

		expect(getJsonPath(out, PATH)).toEqual(ENTRY);
		expect(out.indexOf('"anytype"')).toBeLessThan(out.indexOf('"other"'));
		expect(mutationOnly(text, out, install)).toBe(true);
	});

	test('CRLF files stay CRLF', () => {
		const text = '{\r\n  "a": 1\r\n}\r\n';
		const out = set(text);

		expect(out.includes('\r\n')).toBe(true);
		expect(out.replace(/\r\n/g, '').includes('\n')).toBe(false);
	});

	test('broken JSON or a root array is an error, nothing produced', () => {
		expect(setJsonPath('{ "a": ', PATH, ENTRY)).toEqual({ ok: false, category: 'unparseable' });
		expect(setJsonPath('[ 1 ]', PATH, ENTRY)).toEqual({ ok: false, category: 'unparseable' });
	});
});

describe('mutationOnly', () => {
	test('a change elsewhere fails it', () => {
		const before = '{ "a": 1 }';
		const after = '{ "a": 2, "mcpServers": { "anytype": ' + JSON.stringify(ENTRY) + ' } }';

		expect(mutationOnly(before, after, install)).toBe(false);
		expect(mutationOnly(before, '{ "a": 1, "mcpServers": { "anytype": ' + JSON.stringify(ENTRY) + ' } }', install)).toBe(true);
	});

	test('an unparseable side fails it', () => {
		expect(mutationOnly('{ "a": ', '{}', () => {})).toBe(false);
		expect(mutationOnly('{}', '[', () => {})).toBe(false);
	});
});

describe('removeJsonPath', () => {
	const remove = (text: string) => {
		const res = removeJsonPath(text, PATH);

		if ('category' in res) {
			throw new Error(res.category);
		};
		expect(mutationOnly(text, res.text, uninstall)).toBe(true);
		return res.text;
	};

	test('removes only ours', () => {
		const text = '{\n  "mcpServers": {\n    "a": {},\n    "anytype": { "url": "x" },\n    "b": {}\n  },\n  "x": 1\n}\n';
		const out = remove(text);

		expect(JSON.parse(out)).toEqual({ mcpServers: { a: {}, b: {} }, x: 1 });
		expect(out).toBe('{\n  "mcpServers": {\n    "a": {},\n    "b": {}\n  },\n  "x": 1\n}\n');
	});

	test('anytype first, with a comment before the next server: the comment survives', () => {
		const text = '{\n  "mcpServers": {\n    "anytype": { "url": "x" },\n    // the next one is mine\n    "other": { "command": "y" }\n  }\n}\n';
		const out = remove(text);

		expect(out).toContain('// the next one is mine');
		expect(out).toBe('{\n  "mcpServers": {\n    // the next one is mine\n    "other": { "command": "y" }\n  }\n}\n');
	});

	test('anytype last: the previous comma goes, a comment trailing the previous member stays', () => {
		const text = '{\n  "mcpServers": {\n    "other": {}, // about other\n    "anytype": { "url": "x" }\n  }\n}\n';
		const out = remove(text);

		expect(out).toContain('// about other');
		expect(JSON.parse(out.replace('// about other', ''))).toEqual({ mcpServers: { other: {} } });
		expect(out).toBe('{\n  "mcpServers": {\n    "other": {} // about other\n  }\n}\n');
	});

	test('the only member, with a trailing comma', () => {
		const out = remove('{\n  "mcpServers": {\n    "anytype": { "url": "x" },\n  }\n}\n');

		expect(out).toBe('{\n  "mcpServers": {\n  }\n}\n');
	});

	test('single-line objects', () => {
		expect(remove('{ "mcpServers": { "anytype": {}, "b": 1 } }')).toBe('{ "mcpServers": { "b": 1 } }');
		expect(remove('{ "mcpServers": { "a": 1, "anytype": {} } }')).toBe('{ "mcpServers": { "a": 1 } }');
	});

	test('a comment between our value and its comma → unsupportedForm', () => {
		expect(removeJsonPath('{ "mcpServers": { "anytype": {} /* c */, "b": 1 } }', PATH)).toEqual({ ok: false, category: 'unsupportedForm' });
	});

	test('missing entry or file is success, unchanged', () => {
		expect(removeJsonPath('{ "a": 1 }', PATH)).toEqual({ ok: true, text: '{ "a": 1 }' });
		expect(removeJsonPath(null, PATH)).toEqual({ ok: true, text: '' });
		expect(removeJsonPath('{ "a": ', PATH)).toEqual({ ok: false, category: 'unparseable' });
	});
});

describe('a leading UTF-8 BOM', () => {
	const BOM = '\uFEFF';

	test('BOM + CRLF: parsed, edited, and the BOM put back', () => {
		const text = BOM + '{\r\n  "mcpServers": {}\r\n}\r\n';

		expect(readJson(text)).toEqual({ value: { mcpServers: {} } });

		const out = set(text);

		expect(out.startsWith(BOM)).toBe(true);
		expect(out.slice(1).startsWith(BOM)).toBe(false);
		expect(out.replace(/\r\n/g, '').includes('\n')).toBe(false);
		expect(getJsonPath(out, PATH)).toEqual(ENTRY);
		expect(mutationOnly(text, out, install)).toBe(true);

		const removed = removeJsonPath(out, PATH);

		expect(removed).toMatchObject({ ok: true });
		expect((removed as any).text.startsWith(BOM)).toBe(true);
		expect(readJson((removed as any).text)).toEqual({ value: { mcpServers: {} } });
	});
});

describe('__proto__ is data, never a prototype', () => {
	test('a literal __proto__ member supplies no inherited fields to lookups', () => {
		const text = '{ "__proto__": { "mcpServers": { "anytype": { "url": "inherited" } } } }';
		const read = readJson(text);

		expect('value' in read).toBe(true);
		expect(getJsonPath(text, PATH)).toBeUndefined();
		expect(getJsonPath(text, [ '__proto__', 'mcpServers', 'anytype', 'url' ])).toBe('inherited');
		expect(Object.getPrototypeOf((read as any).value)).toBeNull();
	});

	test('mutationOnly keeps a literal __proto__ member in the comparison', () => {
		const before = '{ "__proto__": { "a": 1 }, "x": 1 }';
		const dropped = '{ "x": 1, "mcpServers": { "anytype": ' + JSON.stringify(ENTRY) + ' } }';
		const kept = '{ "__proto__": { "a": 1 }, "x": 1, "mcpServers": { "anytype": ' + JSON.stringify(ENTRY) + ' } }';

		expect(mutationOnly(before, dropped, install)).toBe(false);
		expect(mutationOnly(before, kept, install)).toBe(true);
	});

	test('canonicalDigest keeps literal keys and ignores key order', () => {
		const a = readJson('{ "b": 1, "a": { "y": [ 1, 2 ], "x": null } }');
		const b = readJson('{ "a": { "x": null, "y": [ 1, 2 ] }, "b": 1 }');
		const withProto = readJson('{ "__proto__": 1, "b": 1, "a": { "y": [ 1, 2 ], "x": null } }');

		expect(canonicalDigest((a as any).value)).toBe(canonicalDigest((b as any).value));
		expect(canonicalDigest((a as any).value)).toMatch(/^[0-9a-f]{64}$/);
		expect(canonicalDigest((withProto as any).value)).not.toBe(canonicalDigest((a as any).value));
		expect(canonicalDigest({ a: 1 })).not.toBe(canonicalDigest({ a: '1' }));
	});
});
