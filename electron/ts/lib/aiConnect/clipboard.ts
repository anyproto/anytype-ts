/**
 * The one guarded copy (tokens-plan §3.4): the only way a key, or a snippet with a key, reaches the clipboard.
 * Main writes the text and keeps only `{ sha256 of the text, generation, deadline }` in memory (never the text);
 * a new copy replaces it. Clearing (the record turned "Connected", the deadline, Cancel setup or Disconnect,
 * an account switch, quit) empties the clipboard only while it still holds exactly that text and that copy is
 * the latest. Best effort: a crash of Anytype leaves it.
 */
import crypto from 'crypto';
import type { Env } from './types';
import { keyFingerprint } from './digest';

/** How long a copied key stays on the clipboard */
export const CLIPBOARD_TTL_MS = 5 * 60 * 1000;

/** Whose key it is: a record, or a key not recorded yet */
export interface SecretOwner {
	accountId: string;
	connectionId?: string;
	appHash?: string;
};

const digest = (text: string): string => crypto.createHash('sha256').update(text, 'utf8').digest('hex');

export class SecretClipboard {

	/** `fp`: the text's key fingerprint (equal to a record's `keyFp` only when the text is exactly that key); `until`: the deadline */
	private held: { hash: string; fp: string; until: number; generation: number; owner: SecretOwner; cancel: () => void } | null = null;
	private generation = 0;

	/** Writes `text`; false when the clipboard can't be written */
	copy (env: Env, text: string, owner: SecretOwner): boolean {
		try {
			env.clipboardWrite(text);
		} catch (e) {
			return false;
		};

		this.held?.cancel();

		const generation = ++this.generation;
		const cancel = env.setTimer(() => this.clearGeneration(env, generation), CLIPBOARD_TTL_MS);

		this.held = { hash: digest(text), fp: keyFingerprint(text), until: env.now() + CLIPBOARD_TTL_MS, generation, owner: { ...owner }, cancel };
		return true;
	};

	/** The latest copy's owner, or null */
	owner (): SecretOwner | null {
		return this.held ? { ...this.held.owner } : null;
	};

	/**
	 * The latest copy, not cleared yet, is exactly the key with fingerprint `fp` (not a snippet, not another key) and
	 * the one `match` names: its deadline, else 0. The clipboard itself is not read (R7)
	 */
	keyUntil (match: (owner: SecretOwner) => boolean, fp: string): number {
		return (this.held && !!fp && (this.held.fp == fp) && match({ ...this.held.owner })) ? this.held.until : 0;
	};

	/** Clears the latest copy when `match` (default: any) says it is the one */
	clear (env: Env, match?: (owner: SecretOwner) => boolean): void {
		if (this.held && (!match || match(this.held.owner))) {
			this.clearGeneration(env, this.held.generation);
		};
	};

	private clearGeneration (env: Env, generation: number): void {
		const held = this.held;

		if (!held || (held.generation != generation)) {
			return;
		};

		this.held = null;
		held.cancel();

		try {
			if (digest(env.clipboardRead()) == held.hash) {
				env.clipboardWrite('');
			};
		} catch (e) { /* best effort */ };
	};

};
