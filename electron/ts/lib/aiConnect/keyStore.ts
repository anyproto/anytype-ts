/**
 * The forwarder's key verbs (plan §2.7, §2.8, §13), run on the verified in-app `anytype-mcp`.
 *
 * - The key goes to `key set` on stdin, never in argv or the environment.
 * - The child's home is `env.home` (HOME / USERPROFILE), so main and the stable copy mean the same folder.
 * - Exit 7 means nothing was read or written. A mutating verb whose receipt is missing or unreadable (exit 1
 *   with `unconfirmed`, a timeout, any output this module doesn't understand) is `unconfirmed`: the item may
 *   hold the new state, and only `key check` can say. Nothing here retries, releases or revokes.
 */
import type { AiError, AiTier, Env, RunResult } from './types';
import { usable } from './forwarder';
import { TIERS, isValidPort } from '../../../../src/ts/lib/aiConnect/catalog';

/** A key verb ends within 30 s whatever blocks (§13); ours is a little longer. Tests shorten it */
export const keyStoreConfig = { timeout: 40 * 1000 };

export const CONNECTION_ID_RE = /^[a-z0-9-]{1,64}$/;
const STAMP_RE = /^[0-9a-f]{16}@[1-9][0-9]{0,17}$/;

export interface ItemInfo {
	fingerprint: string;
	rev: number;
	account: string;
	port: number;
	tier: AiTier;
};

export type CheckResult =
	| ({ present: true } & ItemInfo)
	/** No item (or a stored value that isn't one: `invalid`), and the store could take one */
	| { present: false; invalid?: boolean }
	/** The store couldn't say: `denied` (a folder or item rule failed), `unreachable`, or the forwarder can't be used */
	| { present: null; error: AiError };

export type WriteResult =
	| { ok: true; fingerprint: string; rev: number }
	/** The item may or may not have changed: reconcile with `key check`. `running`: the verb's end couldn't even be confirmed */
	| { ok: false; unconfirmed: true; running?: true }
	/** Nothing was written: `precondition` (the item isn't in the expected state), `noItem`, or an error */
	| { ok: false; precondition: true }
	| { ok: false; noItem: true }
	| { ok: false; error: AiError };

export type DeleteResult = { ok: true } | { ok: false; unconfirmed: true; running?: true } | { ok: false; precondition: true } | { ok: false; noItem: true } | { ok: false; error: AiError };

export const stampOf = (fingerprint: string, rev: number): string => `${fingerprint}@${rev}`;

const err = (stage: AiError['stage'], category: AiError['category']): AiError => ({ stage, category });

const DENIED = err('write', 'storeDenied');
const UNREACHABLE = err('write', 'unknown');

/** The one JSON line a verb prints, or null */
const lineOf = (res: RunResult): any => {
	const lines = String(res.stdout || '').split('\n').map(it => it.trim()).filter(Boolean);

	if (lines.length != 1) {
		return null;
	};
	try {
		const data = JSON.parse(lines[0]);
		return (data && (typeof data == 'object') && !Array.isArray(data)) ? data : null;
	} catch (e) {
		return null;
	};
};

const storeError = (line: any): AiError => (line?.store == 'denied') ? DENIED : UNREACHABLE;

const run = async (env: Env, args: string[], stdin?: string): Promise<RunResult | { error: AiError }> => {
	const own = usable(env);

	if (!('path' in own)) {
		return { error: own.error };
	};

	return env.run(own.path, args, {
		timeout: keyStoreConfig.timeout,
		...((stdin !== undefined) ? { stdin } : {}),
		env: { HOME: env.home, USERPROFILE: env.home },
	});
};

/** `key check`: the item's public half; never the key */
export const keyCheck = async (env: Env, id: string): Promise<CheckResult> => {
	if (!CONNECTION_ID_RE.test(String(id || ''))) {
		return { present: null, error: err('validate', 'unknown') };
	};

	const res = await run(env, [ 'key', 'check', '--connection', id ]);

	if ('error' in res) {
		return { present: null, error: res.error };
	};

	const line = lineOf(res);

	if ((res.code == 0) && line && (line.present === true) && /^[0-9a-f]{16}$/.test(String(line.fingerprint)) && Number.isSafeInteger(line.rev) && (line.rev > 0)
		&& (typeof line.account == 'string') && !!line.account && isValidPort(line.port) && TIERS.includes(line.tier)) {
		return { present: true, fingerprint: line.fingerprint, rev: line.rev, account: line.account, port: line.port, tier: line.tier };
	};
	if ((res.code == 3) && line && (line.present === false)) {
		return line.invalid ? { present: false, invalid: true } : { present: false };
	};
	return { present: null, error: (res.code == 7) ? storeError(line) : UNREACHABLE };
};

/** What a mutating verb's exit code and line mean (§2.8); anything unexpected is `unconfirmed` */
const writeOutcome = (res: RunResult): WriteResult => {
	const line = lineOf(res);

	// Not started at all (no such file, not executable): nothing ran, so nothing was written. A child that
	// spawned and then died (a signal, a kill) may have replaced the item first: that is unconfirmed (Q2)
	if ((res.code == -1) && res.notStarted) {
		return { ok: false, error: err('verify', 'notFound') };
	};
	if (res.indeterminate) {
		return { ok: false, unconfirmed: true, running: true };
	};

	switch (res.code) {
		case 0: {
			if (line?.ok === true) {
				return { ok: true, fingerprint: String(line.fingerprint || ''), rev: Number(line.rev) || 0 };
			};
			break;
		};
		case 2:
		case 6: {
			return { ok: false, error: err('validate', 'unknown') };
		};
		case 3: {
			return { ok: false, noItem: true };
		};
		case 5: {
			return { ok: false, precondition: true };
		};
		case 7: {
			return { ok: false, error: storeError(line) };
		};
	};
	return { ok: false, unconfirmed: true };
};

/** `key set`: the payload (with the key) on stdin only */
export const keySet = async (env: Env, id: string, expect: string, payload: { key: string; account: string; port: number; tier: AiTier }): Promise<WriteResult> => {
	if (!CONNECTION_ID_RE.test(String(id || '')) || ((expect != 'absent') && !STAMP_RE.test(expect)) || !payload.key || !payload.account
		|| !isValidPort(payload.port) || !TIERS.includes(payload.tier)) {
		return { ok: false, error: err('validate', 'unknown') };
	};

	const stdin = JSON.stringify({ key: payload.key, account: payload.account, port: payload.port, tier: payload.tier });
	const res = await run(env, [ 'key', 'set', '--connection', id, '--expect', expect ], stdin);

	if ('error' in res) {
		return { ok: false, error: res.error };
	};

	const out = writeOutcome(res);

	// A receipt for another key than the one sent is no receipt
	if (('fingerprint' in out) && (!/^[0-9a-f]{16}$/.test(out.fingerprint) || (out.rev < 1))) {
		return { ok: false, unconfirmed: true };
	};
	return out;
};

/** `key retarget`: the same key, another port or tier */
export const keyRetarget = async (env: Env, id: string, expect: string, account: string, change: { port: number; tier: AiTier }): Promise<WriteResult> => {
	if (!CONNECTION_ID_RE.test(String(id || '')) || !STAMP_RE.test(expect) || !account || !isValidPort(change.port) || !TIERS.includes(change.tier)) {
		return { ok: false, error: err('validate', 'unknown') };
	};

	const res = await run(env, [ 'key', 'retarget', '--connection', id, '--expect', expect, '--account', account, '--port', String(change.port), '--tier', change.tier ]);
	return ('error' in res) ? { ok: false, error: res.error } : writeOutcome(res);
};

/** `key delete`: only the item in the expected state, of the owning account */
export const keyDelete = async (env: Env, id: string, expect: string, account: string): Promise<DeleteResult> => {
	if (!CONNECTION_ID_RE.test(String(id || '')) || !STAMP_RE.test(expect) || !account) {
		return { ok: false, error: err('validate', 'unknown') };
	};

	const res = await run(env, [ 'key', 'delete', '--connection', id, '--expect', expect, '--account', account ]);

	if ('error' in res) {
		return { ok: false, error: res.error };
	};

	const out = writeOutcome(res);
	return ('fingerprint' in out) ? { ok: true } : out;
};
