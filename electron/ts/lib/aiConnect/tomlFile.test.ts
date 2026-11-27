import { describe, expect, test } from 'vitest';
import { getTomlPath, readToml, removeTomlTable, setTomlTable, tomlString } from './tomlFile';

const TABLE = 'mcp_servers.anytype';
const BODY = `url = ${tomlString('http://127.0.0.1:31009/mcp/large')}\nhttp_headers = { Authorization = ${tomlString('Bearer <KEY>')} }`;

const set = (text: string | null, body = BODY) => {
	const res = setTomlTable(text, TABLE, body);

	if ('category' in res) {
		throw new Error(res.category);
	};
	return res.text;
};

const remove = (text: string) => {
	const res = removeTomlTable(text, TABLE);

	if ('category' in res) {
		throw new Error(res.category);
	};
	return res.text;
};

describe('setTomlTable', () => {
	test('the first table into an empty or missing file', () => {
		const expected = '[mcp_servers.anytype]\nurl = "http://127.0.0.1:31009/mcp/large"\nhttp_headers = { Authorization = "Bearer <KEY>" }\n';

		expect(set(null)).toBe(expected);
		expect(set('')).toBe(expected);
		expect(set('\n\n')).toBe(expected);
		expect(getTomlPath(expected, [ 'mcp_servers', 'anytype', 'http_headers', 'Authorization' ])).toBe('Bearer <KEY>');
	});

	test('other tables and comments stay byte-identical', () => {
		const text = '# Codex config\nmodel = "o3"\n\n[mcp_servers.other]\ncommand = "x" # inline\n\n# trailing\n';
		const out = set(text);

		expect(out.startsWith(text)).toBe(true);
		expect(out.slice(text.length)).toBe('\n[mcp_servers.anytype]\nurl = "http://127.0.0.1:31009/mcp/large"\nhttp_headers = { Authorization = "Bearer <KEY>" }\n');
	});

	test('an existing table is replaced; a comment block before the next table stays', () => {
		const text = [
			'model = "o3"',
			'',
			'[mcp_servers.anytype]',
			'url = "http://127.0.0.1:1/mcp/small"',
			'',
			'# The next server is mine',
			'# keep this',
			'[mcp_servers.other]',
			'command = "x"',
			'',
		].join('\n');
		const out = set(text);

		expect(out).toBe([
			'model = "o3"',
			'',
			'',
			'# The next server is mine',
			'# keep this',
			'[mcp_servers.other]',
			'command = "x"',
			'',
			'[mcp_servers.anytype]',
			'url = "http://127.0.0.1:31009/mcp/large"',
			'http_headers = { Authorization = "Bearer <KEY>" }',
			'',
		].join('\n'));
	});

	test('[mcp_servers.anytype.env] goes with its parent', () => {
		const text = '[mcp_servers.anytype]\ncommand = "old"\n\n[mcp_servers.anytype.env]\nA = "1"\n\n[other]\nb = 2\n';
		const out = set(text);

		expect(readToml(out)).toEqual({ other: { b: 2 }, mcp_servers: { anytype: { url: 'http://127.0.0.1:31009/mcp/large', http_headers: { Authorization: 'Bearer <KEY>' } } } });
		expect(out).toContain('[other]\nb = 2\n');
		expect(out).not.toContain('command = "old"');
		expect(out).not.toContain('A = "1"');
	});

	test.each([
		[ 'inline', 'mcp_servers = { anytype = { url = "x" } }\n' ],
		[ 'dotted', 'mcp_servers.anytype.url = "x"\n' ],
		[ 'dotted under the parent', '[mcp_servers]\nanytype.url = "x"\n' ],
		[ 'quoted', '[mcp_servers."anytype"]\nurl = "x"\n' ],
		[ 'array of tables', '[[mcp_servers.anytype]]\nurl = "x"\n' ],
	])('the %s form → unsupportedForm', (_, text) => {
		expect(setTomlTable(text, TABLE, BODY)).toEqual({ ok: false, category: 'unsupportedForm' });
		expect(removeTomlTable(text, TABLE)).toEqual({ ok: false, category: 'unsupportedForm' });
	});

	test('a multiline string in the span → unsupportedForm', () => {
		const text = '[mcp_servers.anytype]\nnote = """\nhello\n"""\n';

		expect(setTomlTable(text, TABLE, BODY)).toEqual({ ok: false, category: 'unsupportedForm' });
		expect(setTomlTable('[mcp_servers.anytype]\nnote = \'\'\'\nhi\n\'\'\'\n', TABLE, BODY)).toEqual({ ok: false, category: 'unsupportedForm' });
	});

	test('a multiline string elsewhere is fine', () => {
		const text = 'instructions = """\n[not a table]\n"""\n';

		// The header-like line inside the string ends no span of ours, and the guard checks the result
		const res = setTomlTable(text, TABLE, BODY);
		expect(res.ok).toBe(true);
		expect(readToml((res as any).text).instructions).toBe('[not a table]\n');
	});

	test('broken TOML → unparseable', () => {
		expect(setTomlTable('a = ', TABLE, BODY)).toEqual({ ok: false, category: 'unparseable' });
		expect(removeTomlTable('[a\n', TABLE)).toEqual({ ok: false, category: 'unparseable' });
	});

	test('CRLF files stay CRLF', () => {
		const text = 'model = "o3"\r\n\r\n[mcp_servers.anytype]\r\nurl = "old"\r\n\r\n[x]\r\ny = 1\r\n';
		const out = set(text);

		expect(out).toBe('model = "o3"\r\n\r\n\r\n[x]\r\ny = 1\r\n\r\n[mcp_servers.anytype]\r\nurl = "http://127.0.0.1:31009/mcp/large"\r\nhttp_headers = { Authorization = "Bearer <KEY>" }\r\n');
		expect(out.replace(/\r\n/g, '').includes('\n')).toBe(false);
	});

	test('a file without a final newline', () => {
		expect(set('a = 1')).toBe('a = 1\n\n[mcp_servers.anytype]\nurl = "http://127.0.0.1:31009/mcp/large"\nhttp_headers = { Authorization = "Bearer <KEY>" }\n');
	});
});

describe('removeTomlTable', () => {
	test('connect → disconnect on an empty file returns to empty', () => {
		expect(remove(set(''))).toBe('');
	});

	test('connect → disconnect returns the original bytes', () => {
		const text = '# Codex config\nmodel = "o3"\n\n[mcp_servers.other]\ncommand = "x"\n';

		expect(remove(set(text))).toBe(text);
	});

	test('with an explicit [mcp_servers] header the header stays', () => {
		const text = '[mcp_servers]\n';
		const out = remove(set(text));

		expect(out).toBe('[mcp_servers]\n');
		expect(readToml(out)).toEqual({ mcp_servers: {} });
	});

	test('with a sibling server the sibling stays', () => {
		const text = '[mcp_servers.anytype]\nurl = "x"\n\n[mcp_servers.other]\ncommand = "y"\n';
		const out = remove(text);

		expect(readToml(out)).toEqual({ mcp_servers: { other: { command: 'y' } } });
		expect(out).toBe('\n[mcp_servers.other]\ncommand = "y"\n');
	});

	test('removes the sub-tables too; nothing there is success', () => {
		expect(readToml(remove('[mcp_servers.anytype]\nurl = "x"\n[mcp_servers.anytype.env]\nA = "1"\n'))).toEqual({});
		expect(removeTomlTable('a = 1\n', TABLE)).toEqual({ ok: true, text: 'a = 1\n' });
		expect(removeTomlTable(null, TABLE)).toEqual({ ok: true, text: '' });
	});
});

describe('tomlString', () => {
	test('escapes what TOML basic strings require', () => {
		expect(tomlString('a"b\\c\nd\u0001')).toBe('"a\\"b\\\\c\\nd\\u0001"');
		expect(readToml(`x = ${tomlString('a"b\\c\nd\u0001')}`).x).toBe('a"b\\c\nd\u0001');
	});
});
