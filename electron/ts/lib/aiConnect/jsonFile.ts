/**
 * JSON / JSONC edits that keep everything else in the file: comments, trailing commas,
 * indentation, line endings and a leading UTF-8 BOM. Every write is guarded by `mutationOnly`.
 *
 * Values are read through parseTree + getNodeValue, which build null-prototype objects, and walked
 * by own properties only: a literal `__proto__` member is data, never a prototype.
 */
// The ESM build: esbuild can't bundle the UMD one (its factory requires './impl/…' at runtime)
import { applyEdits, createScanner, findNodeAtLocation, getNodeValue, modify, parseTree, type Node, type ParseError } from 'jsonc-parser/lib/esm/main.js';

export { canonicalDigest } from './digest';

const BOM = '\uFEFF';

/** jsonc-parser's SyntaxKind is a const enum, which isolatedModules can't read: the values we use */
const Kind = {
	Comma: 5,
	LineBreak: 14,
	Trivia: 15,
	EOF: 17,
} as const;

export type JsonPath = (string | number)[];
export type EditResult = { ok: true; text: string } | { ok: false; category: 'unparseable' | 'unsupportedForm' };

const PARSE_OPTIONS = { allowTrailingComma: true, disallowComments: false, allowEmptyContent: true };

const isBlank = (text: string | null): boolean => (text === null) || !text.trim();

const isObject = (v: any): boolean => !!v && (typeof v == 'object') && !Array.isArray(v);

const hasOwn = (o: any, k: string | number): boolean => !!o && (typeof o == 'object') && Object.prototype.hasOwnProperty.call(o, k);

/** One leading BOM is set aside for parsing and edits and put back on the result */
const splitBom = (text: string | null): { bom: string; body: string | null } => (text && text.startsWith(BOM)) ? { bom: BOM, body: text.slice(1) } : { bom: '', body: text };

const withBom = (bom: string, res: EditResult): EditResult => ('text' in res) ? { ok: true, text: bom + res.text } : res;

/** null / blank → {}; the root must be an object. Objects have a null prototype. */
export const readJson = (text: string | null): { value: any } | { error: true } => {
	const { body } = splitBom(text);

	if (isBlank(body)) {
		return { value: Object.create(null) };
	};

	const errors: ParseError[] = [];
	const root = parseTree(body, errors, PARSE_OPTIONS);

	if (errors.length || !root || (root.type != 'object')) {
		return { error: true };
	};

	return { value: getNodeValue(root) };
};

const detectFormat = (text: string | null): { insertSpaces: boolean; tabSize: number; eol: string } => {
	const eol = (text && text.includes('\r\n')) ? '\r\n' : '\n';
	const m = isBlank(text) ? null : /^([ \t]+)\S/m.exec(text);

	if (m && m[1].startsWith('\t')) {
		return { insertSpaces: false, tabSize: 1, eol };
	};

	return { insertSpaces: true, tabSize: m ? Math.min(m[1].length, 8) : 2, eol };
};

/** The shortest prefix of `path` that `text` doesn't have yet (`path` itself when all of it exists) */
const missingPrefix = (text: string, path: JsonPath): JsonPath => {
	for (let i = 1; i <= path.length; i++) {
		if (getJsonPath(text, path.slice(0, i)) === undefined) {
			return path.slice(0, i);
		};
	};
	return path;
};

/**
 * The edit changed nothing outside our member (J8): removing it (the part that was missing before, or all of
 * `path` from both texts when it existed) gives back the original bytes; whitespace inside an empty `{}` aside
 */
const onlyOurs = (text: string, out: string, path: JsonPath): boolean => {
	const created = missingPrefix(text, path);
	const existed = (created.length == path.length) && (getJsonPath(text, path) !== undefined);
	const a = removeJsonPath(out, created);
	const b = existed ? removeJsonPath(text, created) : { ok: true as const, text };
	const norm = (t: string) => t.replace(/\{\s*\}/g, '{}');

	return ('text' in a) && ('text' in b) && (norm(a.text) === norm(b.text));
};

/**
 * Our member as a pure insertion (no other byte can change): after a sibling that ends its line, on its own lines at
 * that sibling's indentation; anywhere else inline, as jsonc-parser builds it. null when the edit isn't a single
 * insertion, or a comment shares the insertion's line (it would then follow our member)
 */
const insertAfterSibling = (text: string, path: JsonPath, value: any, options: { insertSpaces: boolean; tabSize: number; eol: string }): string | null => {
	const edits = modify(text, path, value, {});

	if ((edits.length != 1) || edits[0].length) {
		return null;
	};

	const { offset, content } = edits[0];
	const lineEnd = text.indexOf('\n', offset);
	const rest = text.slice(offset, (lineEnd < 0) ? text.length : lineEnd);

	// The sibling ends its line, maybe with its own trailing comma: ours goes on the next lines (with one too)
	const trailing = /^\s*,\s*$/.test(rest);

	if (/\/[/*]/.test(rest)) {
		return null;
	};
	// Inline (a compact object, or the first member of an empty one): the insertion as jsonc-parser builds it
	if (!content.startsWith(',') || (rest.trim() && !trailing)) {
		return text.slice(0, offset) + content + text.slice(offset);
	};

	const created = missingPrefix(text, path);
	const nested = path.slice(created.length).reverse().reduce((acc, k) => ({ [k]: acc }), value);
	const indent = /^[ \t]*/.exec(text.slice(text.lastIndexOf('\n', offset - 1) + 1))[0];
	const unit = options.insertSpaces ? ' '.repeat(options.tabSize) : '\t';
	const member = `${JSON.stringify(created[created.length - 1])}: ${JSON.stringify(nested, null, unit).split('\n').join(options.eol + indent)}`;

	if (trailing) {
		const at = offset + rest.indexOf(',') + 1;
		return `${text.slice(0, at)}${options.eol}${indent}${member},${text.slice(at)}`;
	};
	return `${text.slice(0, offset)},${options.eol}${indent}${member}${text.slice(offset)}`;
};

/**
 * Sets `path` to `value`, creating missing ancestors. A new file gets 2 spaces and a trailing newline. In an existing
 * file nothing outside our member may change (J8): jsonc-parser's formatted edit when removing our member gives
 * back the original bytes, else a pure insertion after the previous member, else `unsupportedForm` (the plan
 * turns that into manual steps before any key exists).
 */
export const setJsonPath = (raw: string | null, path: JsonPath, value: any): EditResult => {
	const { bom, body: text } = splitBom(raw);

	if (!('value' in readJson(text))) {
		return { ok: false, category: 'unparseable' };
	};

	const blank = isBlank(text);
	const source = blank ? '{}' : text;
	const formattingOptions = detectFormat(blank ? null : text);

	try {
		let out = applyEdits(source, modify(source, path, value, { formattingOptions }));

		if (blank) {
			return withBom(bom, { ok: true, text: out.endsWith('\n') ? out : `${out}\n` });
		};
		if (onlyOurs(text, out, path)) {
			return withBom(bom, { ok: true, text: out });
		};

		out = insertAfterSibling(text, path, value, formattingOptions);
		return out ? withBom(bom, { ok: true, text: out }) : { ok: false, category: 'unsupportedForm' };
	} catch (e) {
		return { ok: false, category: 'unsupportedForm' };
	};
};

export const getJsonPath = (text: string | null, path: JsonPath): any => {
	const read = readJson(text);

	if (!('value' in read)) {
		return undefined;
	};

	let cur = read.value;

	for (const seg of path) {
		if (!hasOwn(cur, seg)) {
			return undefined;
		};
		cur = cur[seg];
	};

	return cur;
};

interface Token { kind: number; start: number; end: number };

/** The first token at or after `from` that is not whitespace or a line break; comments count */
const tokenAfter = (text: string, from: number): Token => {
	const scanner = createScanner(text.slice(from), false);

	for (let kind: number = scanner.scan(); kind != Kind.EOF; kind = scanner.scan()) {
		if ((kind == Kind.Trivia) || (kind == Kind.LineBreak)) {
			continue;
		};

		const start = from + scanner.getTokenOffset();
		return { kind, start, end: start + scanner.getTokenLength() };
	};

	return { kind: Kind.EOF, start: text.length, end: text.length };
};

/** [from, to) widened to whole lines when only spaces or tabs surround it on its lines */
const lineRange = (text: string, from: number, to: number): [ number, number ] => {
	let a = from;
	while ((a > 0) && ((text[a - 1] == ' ') || (text[a - 1] == '\t'))) {
		a--;
	};

	let b = to;
	while ((b < text.length) && ((text[b] == ' ') || (text[b] == '\t'))) {
		b++;
	};

	const lineClean = ((a == 0) || (text[a - 1] == '\n'));

	if (lineClean) {
		if (text.startsWith('\r\n', b)) {
			return [ a, b + 2 ];
		};
		if ((text[b] == '\n') || (b == text.length)) {
			return [ a, Math.min(b + 1, text.length) ];
		};
	};

	return [ from, b ];
};

/**
 * Removes the member at `path`. A missing member or file is not an error. Only the member itself and
 * its own comma go: unlike jsonc-parser's removal, a comment that introduces the next member (or
 * trails the previous one) is never taken along. When that can't be done cleanly: `unsupportedForm`.
 */
export const removeJsonPath = (raw: string | null, path: JsonPath): EditResult => {
	const { bom, body: text } = splitBom(raw);

	if (isBlank(text)) {
		return { ok: true, text: raw || '' };
	};

	if (!('value' in readJson(text))) {
		return { ok: false, category: 'unparseable' };
	};

	const root = parseTree(text, [], PARSE_OPTIONS);
	const node = root ? findNodeAtLocation(root, path) : undefined;

	if (!node) {
		return { ok: true, text: raw };
	};

	const prop: Node | undefined = node.parent;
	const parent: Node | undefined = prop?.parent;

	if (!prop || (prop.type != 'property') || !parent || (parent.type != 'object') || !parent.children) {
		return { ok: false, category: 'unsupportedForm' };
	};

	const index = parent.children.indexOf(prop);
	const isLast = (index == (parent.children.length - 1));
	const propEnd = prop.offset + prop.length;
	const after = tokenAfter(text, propEnd);
	const ranges: [ number, number ][] = [];

	let end = propEnd;

	if (after.kind == Kind.Comma) {
		end = after.end;
	} else
	if (!isLast) {
		// Something other than our comma (a comment) sits between our value and the next member
		return { ok: false, category: 'unsupportedForm' };
	};

	ranges.push(lineRange(text, prop.offset, end));

	if (isLast && (index > 0)) {
		// The previous member's comma becomes a trailing comma: it goes too
		const prev = parent.children[index - 1];
		const comma = tokenAfter(text, prev.offset + prev.length);

		if (comma.kind != Kind.Comma) {
			return { ok: false, category: 'unsupportedForm' };
		};
		ranges.push([ comma.start, comma.end ]);
	};

	let out = text;

	ranges.sort((a, b) => b[0] - a[0]).forEach(([ a, b ]) => {
		out = out.slice(0, a) + out.slice(b);
	});

	if (!('value' in readJson(out))) {
		return { ok: false, category: 'unsupportedForm' };
	};

	return withBom(bom, { ok: true, text: out });
};

const deepEqual = (a: any, b: any): boolean => {
	if (a === b) {
		return true;
	};
	if ((typeof a != 'object') || (typeof b != 'object') || !a || !b || (Array.isArray(a) != Array.isArray(b))) {
		return false;
	};

	const ka = Object.keys(a);
	const kb = Object.keys(b);

	return (ka.length == kb.length) && ka.every(k => hasOwn(b, k) && deepEqual(a[k], b[k]));
};

export const jsonDeepEqual = deepEqual;

/** A deep copy with null-prototype objects; own properties only */
export const jsonClone = (v: any): any => {
	if (Array.isArray(v)) {
		return v.map(jsonClone);
	};
	if (v && (typeof v == 'object')) {
		const ret = Object.create(null);

		for (const k of Object.keys(v)) {
			ret[k] = jsonClone(v[k]);
		};
		return ret;
	};
	return v;
};

/**
 * The guard before every write: the parsed original with the intended mutation applied must equal
 * the parsed result. Newly created ancestors on a first install pass; any other change fails.
 */
export const mutationOnly = (beforeText: string | null, afterText: string, mutate: (doc: any) => void): boolean => {
	const before = readJson(beforeText);
	const after = readJson(afterText);

	if (!('value' in before) || !('value' in after)) {
		return false;
	};

	const expected = jsonClone(before.value);

	mutate(expected);
	return deepEqual(expected, after.value);
};

/** Assigns `value` at `path` in a parsed document, creating ancestors (for `mutationOnly`) */
export const setIn = (doc: any, path: JsonPath, value: any): void => {
	let cur = doc;

	for (let i = 0; i < path.length - 1; i++) {
		if (!hasOwn(cur, path[i]) || !isObject(cur[path[i]])) {
			cur[path[i]] = Object.create(null);
		};
		cur = cur[path[i]];
	};

	if (value === undefined) {
		delete cur[path[path.length - 1]];
	} else {
		cur[path[path.length - 1]] = jsonClone(value);
	};
};
