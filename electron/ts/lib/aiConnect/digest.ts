/**
 * What the registry stores instead of secrets and whole entries.
 */
import crypto from 'crypto';

const sha256 = (s: string): string => crypto.createHash('sha256').update(s, 'utf8').digest('hex');

/** First 16 hex of sha256(key) */
export const keyFingerprint = (key: string): string => sha256(String(key)).slice(0, 16);

/** JSON with object keys sorted at every level; own properties only, so a literal `__proto__` key is kept */
export const canonicalJson = (value: any): string => {
	if (Array.isArray(value)) {
		return '[' + value.map(it => (it === undefined) ? 'null' : canonicalJson(it)).join(',') + ']';
	};

	if (value && (typeof value == 'object')) {
		const keys = Object.keys(value).filter(k => value[k] !== undefined).sort();
		return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalJson(value[k])).join(',') + '}';
	};

	return (value === undefined) ? 'null' : JSON.stringify(value);
};

/** sha256 hex of canonicalJson(value): `entryDigest` and `foreignDigest` */
export const canonicalDigest = (value: any): string => sha256(canonicalJson(value));
