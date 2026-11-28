/**
 * One `NAME=value` line in a dotenv file (Hermes' `.env`): read, set and remove it; every other byte stays.
 *
 * Only plain files are accepted (J2); anything else is `unsupportedForm` (read gives null, set and remove refuse):
 * - uniform line endings (all LF or all CRLF, no bare CR);
 * - every line blank, a comment (`#`), or exactly `NAME=VALUE` at column 0 (one BOM on line 1), no `export`, no
 *   spaces around `=`; VALUE unquoted without quotes or backslashes, or `'…'` / `"…"` without backslashes, closed
 *   on the same line; optionally followed by spaces and a `#` comment;
 * - no line other than our own assignment mentions our variable (`OTHER=${NAME}` would hand our key to OTHER).
 */

export type EnvEditResult = { ok: true; text: string } | { ok: false; category: 'unsupportedForm' };

const LINE_RE = /^[A-Za-z_][A-Za-z0-9_]*=(?:'[^'\\]*'|"[^"\\]*"|[^'"\\]*)(?:\s+#.*)?$/;

const eolOf = (text: string): string => /\r\n/.test(text) ? '\r\n' : '\n';

/** The text's lines with their own endings */
const segments = (text: string): string[] => text ? text.split(/(?<=\n)/) : [];

const bare = (segment: string): string => segment.replace(/\r?\n$/, '');

const isOurs = (line: string, name: string): boolean => line.replace(/^\uFEFF/, '').startsWith(`${name}=`);

/** A plain file (see the file comment) */
export const envUsable = (text: string | null, name: string): boolean => {
	const src = String(text || '');
	const crlf = /\r\n/.test(src);

	if (crlf ? /(^|[^\r])\n|\r(?!\n)/.test(src) : /\r/.test(src)) {
		return false;
	};

	return segments(src).every((segment, i) => {
		const line = bare(segment).replace(i ? /^$/ : /^\uFEFF/, '');

		if (!line.trim() || line.trimStart().startsWith('#')) {
			return true;
		};
		return LINE_RE.test(line) && (isOurs(line, name) || !line.includes(name));
	});
};

/** A value as dotenv reads it: quotes removed; an unquoted value ends before ` #` */
const unquote = (raw: string): string => {
	const v = raw.trim();
	const m = /^(['"])(.*?)\1(?:\s+#.*)?$/.exec(v);

	return m ? m[2] : v.replace(/\s+#.*$/, '').trim();
};

/** The value of the last line defining `name`, or null (also for a file that isn't plain) */
export const readEnvVar = (text: string | null, name: string): string | null => {
	if (!envUsable(text, name)) {
		return null;
	};

	const line = segments(String(text || '')).map(bare).filter(l => isOurs(l, name)).pop();

	return (line === undefined) ? null : unquote(line.slice(line.indexOf('=') + 1));
};

/**
 * `name=value` spliced in: the first line defining it is replaced (its ending kept), later duplicates dropped with
 * theirs; absent, it is appended (after a file without a final newline: a separator and no newline of our own)
 */
export const setEnvVar = (text: string | null, name: string, value: string): EnvEditResult => {
	if (!envUsable(text, name)) {
		return { ok: false, category: 'unsupportedForm' };
	};

	const src = String(text || '');
	const line = `${name}=${value}`;
	let done = false;

	const next = segments(src).reduce((acc: string[], segment) => {
		if (!isOurs(bare(segment), name)) {
			acc.push(segment);
		} else
		if (!done) {
			acc.push(line + segment.slice(bare(segment).length));
			done = true;
		};
		return acc;
	}, []).join('');

	if (done) {
		return { ok: true, text: next };
	};
	if (!src) {
		return { ok: true, text: `${line}\n` };
	};
	return { ok: true, text: src.endsWith('\n') ? `${src}${line}${eolOf(src)}` : `${src}${eolOf(src)}${line}` };
};

/** Every line defining `name` removed with its ending; a removed last line without one takes the separator before it */
export const removeEnvVar = (text: string | null, name: string): EnvEditResult => {
	if (!envUsable(text, name)) {
		return { ok: false, category: 'unsupportedForm' };
	};

	const all = segments(String(text || ''));
	const kept = all.filter(segment => !isOurs(bare(segment), name));
	const last = all[all.length - 1];
	const out = kept.join('');

	// Our line was the last one, without a newline: the newline before it was ours too
	return { ok: true, text: (last && !last.endsWith('\n') && isOurs(last, name)) ? out.replace(/\r?\n$/, '') : out };
};
