/**
 * The one guarded copy (tokens-plan §3.4): the only way a key, or a snippet with a key, reaches the clipboard.
 * Main writes the text and keeps only `{ sha256 of the text, generation, deadline }` in memory (never the text);
 * a new copy replaces it. Clearing (the record turned "Connected", the deadline, Cancel setup or Disconnect,
 * an account switch, quit) empties the clipboard only while it still holds exactly that text and that copy is
 * the latest. Best effort: a crash of Anytype leaves it.
 */
import crypto from 'crypto';
import type { Env } from './types';

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

	private held: { hash: string; generation: number; owner: SecretOwner; cancel: () => void } | null = null;
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

		this.held = { hash: digest(text), generation, owner: { ...owner }, cancel };
		return true;
	};

	/** The latest copy's owner, or null */
	owner (): SecretOwner | null {
		return this.held ? { ...this.held.owner } : null;
	};

	/** The latest copy, not cleared yet, is the one `match` names (the clipboard itself is not read) */
	holds (match: (owner: SecretOwner) => boolean): boolean {
		return !!this.held && match({ ...this.held.owner });
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
