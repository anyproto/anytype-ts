/**
 * Line-based TOML edits for one table (`mcp_servers.anytype`): the table's own lines are replaced or
 * removed, every other byte stays. smol-toml only parses; it never re-serialises the user's file.
 */
import { parse } from 'smol-toml';
import { jsonDeepEqual } from './jsonFile';

export type TomlEditResult = { ok: true; text: string } | { ok: false; category: 'unparseable' | 'unsupportedForm' };

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isBlank = (text: string | null): boolean => (text === null) || !text.trim();

/** Parsed document, or null when the text is not valid TOML. null / blank → {} */
export const readToml = (text: string | null): Record<string, any> | null => {
	if (isBlank(text)) {
		return {};
	};

	try {
		return parse(text);
	} catch (e) {
		return null;
	};
};

/** Plain data for comparisons: dates become strings */
const plain = (v: any): any => JSON.parse(JSON.stringify(v));

/** Own properties only: a `__proto__` table name is data, never a prototype */
const getIn = (doc: any, path: string[]): any => path.reduce((cur, k) => ((cur && (typeof cur == 'object') && Object.prototype.hasOwnProperty.call(cur, k)) ? cur[k] : undefined), doc);

/** Lines with their terminators, so joining them gives the text back byte for byte */
const splitLines = (text: string): string[] => text.match(/[^\n]*\n|[^\n]+$/g) || [];

const isBlankOrComment = (line: string): boolean => /^\s*(#.*)?$/.test(line.replace(/\r?\n$/, ''));

interface Span { start: number; end: number };

/**
 * Line spans of the table and its sub-tables. A span starts at the header and ends at the last
 * non-blank, non-comment line before the next table header, so comments that introduce the next
 * table stay with it. A span holding a multiline string can't be cut safely: `unsupportedForm`.
 */
const findSpans = (lines: string[], table: string): Span[] | 'unsupportedForm' => {
	const header = new RegExp(`^\\s*\\[${escapeRe(table)}(\\.[^\\]]+)?\\]\\s*(#.*)?$`);
	const anyHeader = /^\s*\[/;
	const spans: Span[] = [];

	for (let i = 0; i < lines.length; i++) {
		if (!header.test(lines[i].replace(/\r?\n$/, ''))) {
			continue;
		};

		let next = i + 1;
		while ((next < lines.length) && !anyHeader.test(lines[next])) {
			next++;
		};

		let end = next - 1;
		while ((end > i) && isBlankOrComment(lines[end])) {
			end--;
		};

		const body = lines.slice(i, end + 1).join('');
		if (body.includes('"""') || body.includes('\'\'\'')) {
			return 'unsupportedForm';
		};

		spans.push({ start: i, end });
		i = end;
	};

	return spans;
};

/** Removes the spans; a blank line left right before a span that ended the file goes too */
const cutSpans = (lines: string[], spans: Span[]): string => {
	const keep = lines.slice();

	for (let s = spans.length - 1; s >= 0; s--) {
		const { start, end } = spans[s];
		const atEof = !keep.slice(end + 1).some(l => l.trim());
		let from = start;

		if (atEof && (from > 0) && !keep[from - 1].trim()) {
			from--;
		};
		keep.splice(from, end - from + 1);
	};

	return keep.join('');
};

/** Shared steps 1–3: parse, find the spans, refuse forms Anytype can't edit line by line */
const prepare = (text: string | null, table: string): { doc: Record<string, any>; lines: string[]; rest: string } | { category: 'unparseable' | 'unsupportedForm' } => {
	const doc = readToml(text);

	if (!doc) {
		return { category: 'unparseable' };
	};

	const lines = splitLines(text || '');
	const spans = findSpans(lines, table);

	if (spans == 'unsupportedForm') {
		return { category: 'unsupportedForm' };
	};

	const path = table.split('.');
	const rest = cutSpans(lines, spans);

	// Inline, dotted or quoted forms: the table is in the document but not (only) under its own headers
	if (getIn(doc, path) !== undefined) {
		const left = readToml(rest);
		if (!left || (getIn(left, path) !== undefined)) {
			return { category: 'unsupportedForm' };
		};
	};

	return { doc, lines, rest };
};

/**
 * Replaces (or adds) `[<table>]` with `body` (TOML key lines). The new table goes at the end of the
 * file. The guard compares the result with the parsed original after the intended mutation.
 */
export const setTomlTable = (text: string | null, table: string, body: string): TomlEditResult => {
	const prep = prepare(text, table);

	if ('category' in prep) {
		return { ok: false, category: prep.category };
	};

	const value = readToml(body);
	if (!value) {
		return { ok: false, category: 'unparseable' };
	};

	const eol = (text && text.includes('\r\n')) ? '\r\n' : '\n';
	const block = [ `[${table}]` ].concat(body.replace(/\r?\n$/, '').split(/\r?\n/)).join(eol) + eol;

	let out = prep.rest;
	if (out.trim()) {
		if (!out.endsWith('\n')) {
			out += eol;
		};
		out += eol;
	} else {
		out = '';
	};
	out += block;

	const expected = plain(prep.doc);
	const path = table.split('.');
	let cur = expected;

	for (let i = 0; i < path.length - 1; i++) {
		if (!cur[path[i]] || (typeof cur[path[i]] != 'object')) {
			cur[path[i]] = {};
		};
		cur = cur[path[i]];
	};
	cur[path[path.length - 1]] = plain(value);

	const result = readToml(out);
	if (!result || !jsonDeepEqual(plain(result), expected)) {
		return { ok: false, category: 'unparseable' };
	};

	return { ok: true, text: out };
};

/**
 * Removes `[<table>]` and its sub-tables. An implicit parent left empty disappears with its last
 * child; an explicit `[parent]` header stays (it parses to an empty table).
 */
export const removeTomlTable = (text: string | null, table: string): TomlEditResult => {
	const prep = prepare(text, table);

	if ('category' in prep) {
		return { ok: false, category: prep.category };
	};

	const path = table.split('.');

	if (getIn(prep.doc, path) === undefined) {
		return { ok: true, text: text || '' };
	};

	const expected = plain(prep.doc);
	const parentPath = path.slice(0, -1);
	const parent = getIn(expected, parentPath);

	delete parent[path[path.length - 1]];

	if (parentPath.length && !Object.keys(parent).length) {
		const explicit = new RegExp(`^\\s*\\[${escapeRe(parentPath.join('.'))}\\]\\s*(#.*)?$`, 'm');

		if (!explicit.test(prep.lines.join(''))) {
			delete getIn(expected, parentPath.slice(0, -1))[parentPath[parentPath.length - 1]];
		};
	};

	const result = readToml(prep.rest);
	if (!result || !jsonDeepEqual(plain(result), expected)) {
		return { ok: false, category: 'unparseable' };
	};

	return { ok: true, text: prep.rest };
};

/** TOML basic string with the characters TOML requires escaped */
export const tomlString = (s: string): string => '"' + String(s).replace(/[\\"\u0000-\u001F\u007F]/g, c => {
	switch (c) {
		case '\\': return '\\\\';
		case '"': return '\\"';
		case '\n': return '\\n';
		case '\r': return '\\r';
		case '\t': return '\\t';
		default: return '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0');
	};
}) + '"';

export const getTomlPath = (text: string | null, path: string[]): any => {
	const doc = readToml(text);
	return doc ? getIn(doc, path) : undefined;
};
