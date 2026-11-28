/**
 * YAML edits that are lossless or refused (Hermes' config.yaml), with the `yaml` package's Document API:
 * - a document with an anchor, an alias or a `<<` merge key is refused (`unsupportedForm`);
 * - the document must re-serialize byte for byte before the edit (with indentless lists, as PyYAML writes
 *   them, or indented ones), so untouched nodes come out identical and the only text change is the edit;
 * - the edited document read back must equal the original with only the edited path changed;
 * - anything the parser can't read, or throws on (deep nesting), is `unparseable`.
 */
import { isAlias, isMap, isScalar, parseDocument, visit, type Document } from 'yaml';
import { jsonDeepEqual } from './jsonFile';

export type YamlPath = string[];
export type YamlEditResult = { ok: true; text: string } | { ok: false; category: 'unparseable' | 'unsupportedForm' };

const OPTIONS = { prettyErrors: false, uniqueKeys: true } as const;
/** PyYAML's indentless lists first (Hermes writes them), then indented ones (hand-edited files) */
const OUTPUTS = [ { indentSeq: false }, { indentSeq: true } ] as const;

type Output = typeof OUTPUTS[number];

const isBlank = (text: string | null): boolean => (text === null) || !text.trim();

const parse = (text: string | null): Document | null => {
	try {
		const doc = parseDocument(String(text || ''), OPTIONS);
		return (doc.errors.length || doc.warnings.length) ? null : doc;
	} catch (e) {
		return null;
	};
};

/** An anchor, an alias or a merge key anywhere */
const hasLinks = (doc: Document): boolean => {
	let found = false;

	visit(doc, {
		Alias: () => {
			found = true;
			return visit.BREAK;
		},
		Node: (key, node: any) => {
			if (node?.anchor) {
				found = true;
				return visit.BREAK;
			};
		},
		Pair: (key, pair: any) => {
			if (isScalar(pair.key) && (pair.key.value === '<<')) {
				found = true;
				return visit.BREAK;
			};
		},
	});
	return found;
};

/**
 * The document, ready for a lossless edit, with the output options that reproduce it byte for byte; or why not.
 * A blank file is an empty map.
 */
export const editableYaml = (text: string | null): { doc: Document; output: Output } | { category: 'unparseable' | 'unsupportedForm' } => {
	if (isBlank(text)) {
		const doc = parseDocument('', OPTIONS);

		doc.contents = doc.createNode({}) as any;
		return { doc, output: OUTPUTS[0] };
	};

	const doc = parse(text);

	if (!doc) {
		return { category: 'unparseable' };
	};
	if (hasLinks(doc)) {
		return { category: 'unsupportedForm' };
	};

	try {
		const output = OUTPUTS.find(o => doc.toString(o) === text);
		return output ? { doc, output } : { category: 'unsupportedForm' };
	} catch (e) {
		return { category: 'unparseable' };
	};
};

/** The document as plain data, or `{ error }` when it isn't one plain YAML document (aliases included) */
export const readYaml = (text: string | null): { value: any } | { error: true } => {
	if (isBlank(text)) {
		return { value: null };
	};

	const doc = parse(text);

	if (!doc) {
		return { error: true };
	};
	try {
		return { value: doc.toJS({ maxAliasCount: 0 }) };
	} catch (e) {
		return { error: true };
	};
};

/** The plain value at `path`, undefined when absent (or the file isn't readable YAML) */
export const getYamlPath = (text: string | null, path: YamlPath): any => {
	const doc = readYaml(text);

	if (!('value' in doc)) {
		return undefined;
	};
	return path.reduce((acc, key) => ((acc && (typeof acc == 'object') && !Array.isArray(acc) && Object.prototype.hasOwnProperty.call(acc, key)) ? acc[key] : undefined), doc.value);
};

/** `doc` with `path` set to `value` (undefined = removed), as plain data */
const expected = (before: any, path: YamlPath, value: any): any => {
	const root = (before && (typeof before == 'object')) ? JSON.parse(JSON.stringify(before)) : {};
	let node = root;

	for (const key of path.slice(0, -1)) {
		if (!node[key] || (typeof node[key] != 'object')) {
			node[key] = {};
		};
		node = node[key];
	};
	if (value === undefined) {
		delete node[path[path.length - 1]];
	} else {
		node[path[path.length - 1]] = value;
	};
	return root;
};

/** The edited text changes the document exactly at `path` */
const onlyThat = (beforeText: string | null, afterText: string, path: YamlPath, value: any): boolean => {
	const before = readYaml(beforeText);
	const after = readYaml(afterText);

	return ('value' in before) && ('value' in after) && jsonDeepEqual(after.value, expected(before.value, path, value));
};

/** The lines with a `#`, in order: an edit must keep every comment exactly where it was (J7) */
const commentLines = (text: string | null): string[] => String(text || '').split(/\r?\n/).filter(l => l.includes('#'));

const sameComments = (before: string | null, after: string): boolean => {
	const a = commentLines(before);
	const b = commentLines(after);

	return (a.length == b.length) && a.every((l, i) => l === b[i]);
};

/**
 * The root and every existing map among `path`'s parents are block maps: a non-empty flow collection would be
 * re-laid out (J7) → false; an empty `{}` becomes a block map, so our entry is written as lines
 */
const blockPath = (doc: Document, path: YamlPath): boolean => {
	const nodes = [ doc.contents, ...path.slice(0, -1).map((k, i) => doc.getIn(path.slice(0, i + 1), true)) ];

	for (const node of nodes) {
		if (isMap(node) && node.flow) {
			if (node.items.length) {
				return false;
			};
			node.flow = false;
		};
	};
	return true;
};

const serialize = (doc: Document, output: Output): string | null => {
	try {
		return doc.toString(output);
	} catch (e) {
		return null;
	};
};

/**
 * Sets `path` to `value`. Missing parents become maps, an empty parent (`mcp_servers:`) too; a parent that is a
 * list or a scalar is `unsupportedForm`; see the file comment for what is refused before any edit.
 */
export const setYamlPath = (text: string | null, path: YamlPath, value: any): YamlEditResult => {
	const ready = editableYaml(text);

	if ('category' in ready) {
		return { ok: false, category: ready.category };
	};

	const { doc, output } = ready;

	if ((doc.contents === null) || (isScalar(doc.contents) && (doc.contents.value === null))) {
		doc.contents = doc.createNode({}) as any;
	};
	if (!isMap(doc.contents) || !blockPath(doc, path)) {
		return { ok: false, category: 'unsupportedForm' };
	};

	for (let i = 1; i < path.length; i++) {
		const parent = path.slice(0, i);
		const node = doc.getIn(parent, true);

		if ((node === undefined) || (isScalar(node) && (node.value === null))) {
			doc.setIn(parent, doc.createNode({}));
		} else
		if (isAlias(node) || !isMap(node)) {
			return { ok: false, category: 'unsupportedForm' };
		};
	};

	doc.setIn(path, doc.createNode(value));

	const out = serialize(doc, output);

	if ((out !== null) && !sameComments(text, out)) {
		return { ok: false, category: 'unsupportedForm' };
	};
	return ((out !== null) && onlyThat(text, out, path, value)) ? { ok: true, text: out } : { ok: false, category: 'unparseable' };
};

/** Removes `path` (absent: unchanged); the parents stay. The same refusals as setYamlPath */
export const removeYamlPath = (text: string | null, path: YamlPath): YamlEditResult => {
	if (isBlank(text)) {
		return { ok: true, text: String(text || '') };
	};

	const ready = editableYaml(text);

	if ('category' in ready) {
		return { ok: false, category: ready.category };
	};
	if (getYamlPath(text, path) === undefined) {
		return { ok: true, text: String(text) };
	};

	if (!blockPath(ready.doc, path)) {
		return { ok: false, category: 'unsupportedForm' };
	};

	ready.doc.deleteIn(path);

	const out = serialize(ready.doc, ready.output);

	if ((out !== null) && !sameComments(text, out)) {
		return { ok: false, category: 'unsupportedForm' };
	};
	return ((out !== null) && onlyThat(text, out, path, undefined)) ? { ok: true, text: out } : { ok: false, category: 'unparseable' };
};

/** The YAML of `value` nested under `path`, for a manual step */
export const yamlSnippet = (path: YamlPath, value: any): string => {
	const nested = path.slice().reverse().reduce((acc, k) => ({ [k]: acc }), value);
	const doc = parseDocument('');

	doc.contents = doc.createNode(nested) as any;
	return doc.toString(OUTPUTS[0]);
};
