/**
 * A connection's item in the forwarder's store, as the adapters use it: whose it is, and the three changes
 * with their bookkeeping (plan §2.9). Every change is announced to the service first (`ctx.journal`), so a
 * lost receipt can be settled by `key check` alone.
 */
import type { AiError, AiMethod, AiNextStep, AiRecord, AiRoute, AiTier, Ctx, Env } from './types';
import { canonicalDigest, keyFingerprint } from './digest';
import { itemLabel } from './forwarder';
import { keyCheck, keyDelete, keyRetarget, keySet, stampOf, type ItemInfo } from './keyStore';
import { goneError, mayWrite, type WriteMode } from './adapters/common';

export type ItemState =
	| { ok: true; existing: 'none'; label: string }
	| ({ ok: true; existing: 'ours' | 'foreign'; label: string; digest: string } & ItemInfo)
	| { ok: false; error: AiError };

const err = (stage: AiError['stage'], category: AiError['category'], path?: string): AiError => ({ stage, category, ...(path ? { path } : {}) });

/** Every fingerprint the record may have in its item: its key and its unconfirmed candidates */
const ownFps = (rec: AiRecord | null): string[] => [ rec?.keyFp, ...(rec?.unconfirmed || []).map(c => c.keyFp), ...(rec?.itemFps || []) ].filter(Boolean);

/**
 * The item as it is now and whether `rec` (of `accountId`) owns it: the same account and one of the
 * record's fingerprints. An item of another account, or with a key no record of ours knows, is foreign.
 */
export const itemState = async (env: Env, id: string, rec: AiRecord | null, accountId: string): Promise<ItemState> => {
	const label = itemLabel(env, id);
	const res = await keyCheck(env, id);

	if ('error' in res) {
		return { ok: false, error: { ...res.error, ...((res.error.category == 'storeDenied') ? { path: label } : {}) } };
	};
	if (!('fingerprint' in res)) {
		return { ok: true, existing: 'none', label };
	};

	const ours = !!accountId && (res.account == accountId) && (!!rec && (rec.accountId == accountId)) && ownFps(rec).includes(res.fingerprint);
	const { fingerprint, rev, account, port, tier } = res;

	return { ok: true, existing: ours ? 'ours' : 'foreign', label, digest: canonicalDigest(stampOf(fingerprint, rev)), fingerprint, rev, account, port, tier };
};

/** A replace consent that names exactly the item as it is now */
const itemConsent = (ctx: Ctx, own: { label: string; digest: string }): boolean => !!ctx.replace && (ctx.replace.targetPath == own.label) && (ctx.replace.foreignDigest == own.digest);

export type CommitResult =
	| { ok: true; label: string; rev: number }
	/** The receipt was lost: the candidate saved by the journal stays, the next check settles it */
	| { ok: false; unconfirmed: true; label: string; running?: true }
	| { ok: false; error: AiError; gone?: boolean };

/** What a delivery leaves besides the key: the config entry it wrote (Q15) */
export interface ItemIntent {
	method: AiMethod; route: AiRoute; nextStep: AiNextStep; targetPath?: string;
	configEntry?: { command: string; args: string[]; env?: Record<string, string> }; entryDigest?: string; configPath?: string;
};

/**
 * `key set` for an apply: allowed when the item is absent (and was), ours, or exactly the foreign one the
 * user agreed to replace (common.mayWrite); the candidate is saved first; one retry when the item changed
 * between the read and the write.
 */
export const commitItem = async (
	ctx: Ctx, id: string, rec: AiRecord | null,
	intent: ItemIntent,
	wasPresent?: boolean,
): Promise<CommitResult> => {
	let before = wasPresent;

	for (let attempt = 0; attempt < 2; attempt++) {
		const own = await itemState(ctx.env, id, rec, ctx.accountId);

		if ('error' in own) {
			return { ok: false, error: own.error };
		};

		const here = own.existing != 'none';

		if (before === undefined) {
			before = here;
		};

		const verdict = mayWrite({
			mode: 'install', present: here, owned: own.existing == 'ours', consent: here && itemConsent(ctx, own as any),
			consentHere: ctx.replace?.targetPath == own.label, wasPresent: before,
		});

		if (verdict == 'conflict') {
			return { ok: false, error: err('validate', 'conflict', own.label) };
		};
		if (verdict == 'gone') {
			return { ok: false, gone: true, error: goneError('install', own.label) };
		};
		if (ctx.journal && !ctx.journal.set({ ...intent, targetPath: intent.targetPath ?? own.label })) {
			return { ok: false, error: err('write', 'unsaved') };
		};

		const expect = ('fingerprint' in own) ? stampOf(own.fingerprint, own.rev) : 'absent';
		const res = await keySet(ctx.env, id, expect, { key: ctx.key, account: ctx.accountId, port: ctx.port, tier: ctx.tier });

		if ('fingerprint' in res) {
			// The receipt must be for the key that was sent
			return (res.fingerprint == keyFingerprint(ctx.key)) ? { ok: true, label: own.label, rev: res.rev } : { ok: false, unconfirmed: true, label: own.label };
		};
		if ('unconfirmed' in res) {
			return { ok: false, unconfirmed: true, label: own.label, ...(res.running ? { running: true as const } : {}) };
		};
		if ('error' in res) {
			return { ok: false, error: res.error };
		};
		// precondition / noItem: the item changed since it was read; once more from the top
	};
	return { ok: false, error: err('write', 'changed') };
};

export type RetargetResult = { ok: true; rev: number } | { ok: false; unconfirmed: true } | { ok: false; error: AiError; gone?: boolean };

/** `key retarget` on the record's own item (a heal or an update); the intent is saved first. Never creates an item */
export const retargetItem = async (ctx: Ctx, id: string, rec: AiRecord, change: { port: number; tier: AiTier }, mode: WriteMode = 'owned'): Promise<RetargetResult> => {
	const own = await itemState(ctx.env, id, rec, rec.accountId);

	if ('error' in own) {
		return { ok: false, error: own.error };
	};
	if (own.existing == 'none') {
		return { ok: false, gone: true, error: goneError(mode, own.label) };
	};
	if (own.existing == 'foreign') {
		return { ok: false, error: err('validate', 'conflict', own.label) };
	};
	if (ctx.journal && !ctx.journal.retarget({ port: change.port, tier: change.tier, rev: own.rev + 1 })) {
		return { ok: false, error: err('write', 'unsaved') };
	};

	const res = await keyRetarget(ctx.env, id, stampOf(own.fingerprint, own.rev), rec.accountId, change);

	if ('fingerprint' in res) {
		return { ok: true, rev: res.rev };
	};
	if ('unconfirmed' in res) {
		return { ok: false, unconfirmed: true };
	};
	if ('noItem' in res) {
		return { ok: false, gone: true, error: goneError(mode, own.label) };
	};
	return { ok: false, error: ('error' in res) ? res.error : err('write', 'changed', own.label) };
};

export type DeleteOutcome =
	/** `deleted`: this record's item is gone now; `none`: there was none; `foreign`: an item is there and isn't this record's (left alone) */
	| { done: true; owner: 'deleted' | 'none' | 'foreign' }
	/** The item may still be there (no receipt, or the store couldn't be used): tried again by the next check */
	| { done: false; left: true };

/**
 * `key delete` of the record's own item. An item that changed between the read and the delete is read once
 * more before anything is concluded (Q4).
 */
export const deleteItem = async (env: Env, id: string, rec: AiRecord): Promise<DeleteOutcome> => {
	for (let attempt = 0; attempt < 2; attempt++) {
		const own = await itemState(env, id, rec, rec.accountId);

		if ('error' in own) {
			return { done: false, left: true };
		};
		if (own.existing == 'none') {
			return { done: true, owner: 'none' };
		};
		if (own.existing == 'foreign') {
			return { done: true, owner: 'foreign' };
		};

		const res = await keyDelete(env, id, stampOf((own as ItemInfo).fingerprint, (own as ItemInfo).rev), rec.accountId);

		if (('ok' in res) && res.ok) {
			return { done: true, owner: 'deleted' };
		};
		if ('noItem' in res) {
			return { done: true, owner: 'none' };
		};
		if (!('precondition' in res)) {
			return { done: false, left: true };
		};
		// precondition: the item changed since it was read; once more
	};
	return { done: false, left: true };
};
