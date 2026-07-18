import { observable, action, makeObservable, runInAction } from 'mobx';
import { flushSync } from 'react-dom';
import { getRange } from 'selection-ranges';
import * as I from 'Interface';
import * as M from 'Model';
import { focus } from './focus';

interface Fork {
	rootId: string;
	newId: string;
	sentText: string;
	sentMarks: I.Mark[];
	domAtSend: { text: string; marks: I.Mark[]; };
	pending: { text: string; marks: I.Mark[]; };
	cbQueue: ((message: any) => void)[];
};

const FORK_HISTORY_LIMIT = 64;

/**
 * VirtualBlock owns block-identity indirection for the two flows that protect
 * concurrent editing from the whole-value last-writer-wins text CRDT:
 *
 * 1. The trailing "click to type" placeholder. Clicking the empty area below
 *    the document content must not create a block: an empty block synced to
 *    peers becomes a shared caret target, and two clients typing into the same
 *    block id silently destroy each other's text. The editor renders a purely
 *    presentational text block with a constant virtual id that exists only in
 *    this client's React tree — it is never added to the block store and never
 *    synced. The first real input materializes it: a single BlockCreate carries
 *    the initial content, and further writes are redirected to the returned id.
 *
 * 2. Identity forking for existing empty blocks (BlockReplace). Any existing
 *    empty text block (a blank line from Enter, a legacy trailing block, the
 *    first block of a fresh note) is the same shared register: two users
 *    filling it concurrently merge to one text. The first content put into an
 *    empty block therefore never calls BlockTextSetText — it calls BlockReplace
 *    with a block model carrying the content plus everything the empty block
 *    already had (style, checked, color, background, align, fields). Replace is
 *    remove(old) + create(new) in one atomic change, so two users filling the
 *    same empty block produce two independent creates (both survive) and two
 *    idempotent removes: two blocks, both texts intact.
 *
 * Both flows share the same mechanics: writes are intercepted at
 * U.Data.blockSetText, callbacks issued against the old id while the request is
 * in flight are queued and run after the swap, resolve() maps stale ids to the
 * live one, and the visual swap happens in a single synchronous task
 * (flushSync + focus.apply) so no keystrokes are lost. Swaps are deferred while
 * an IME composition is active to avoid destroying the composition DOM.
 */
class VirtualBlock {

	rootId = '';
	isPopup = false;
	isActive = false;
	realId = '';
	isSwapped = false;
	isCreating = false;

	private generation = 0;
	private block: I.Block = null;
	private sentText = '';
	private sentMarks: I.Mark[] = [];
	private domAtSend: { text: string; marks: I.Mark[]; } = null;
	private pending: { text: string; marks: I.Mark[]; } = null;
	private cbQueue: ((message: any) => void)[] = [];
	private orphans: Map<number, { text: string; marks: I.Mark[]; }> = new Map();
	private compositionHandler: (() => void) = null;

	private forks: Map<string, Fork> = new Map();
	private noFork: Set<string> = new Set();

	constructor () {
		makeObservable(this, {
			isActive: observable,
			realId: observable,
			isSwapped: observable,
			activate: action,
			deactivate: action,
		});
	};

	get id (): string {
		return J.Constant.blockId.virtualLast;
	};

	isVirtualId (id: string): boolean {
		return id == this.id;
	};

	/**
	 * Maps stale ids to the live block id: the virtual placeholder id to its
	 * materialized block, and forked ids to their replacements. Fork mappings
	 * are only followed while the old block is actually gone — undo restores
	 * the old identity and must win.
	 */
	resolve (id: string): string {
		if (this.isVirtualId(id) && this.realId) {
			id = this.realId;
		};

		let guard = 0;
		while (guard++ < 10) {
			const fork = this.forks.get(id);

			if (!fork || !fork.newId) {
				break;
			};
			if (S.Block.getLeaf(fork.rootId, id) || !S.Block.getLeaf(fork.rootId, fork.newId)) {
				break;
			};

			id = fork.newId;
		};

		return id;
	};

	/**
	 * Id of the materialized block that is still represented by the placeholder
	 * (creation finished but the swap is deferred, e.g. during IME composition).
	 * Children must skip it to avoid rendering the block twice.
	 */
	getHoldId (rootId: string): string {
		return ((this.rootId == rootId) && this.realId && !this.isSwapped) ? this.realId : '';
	};

	isRendered (rootId: string, isPopup: boolean): boolean {
		return this.isActive && (this.rootId == rootId) && (this.isPopup == isPopup);
	};

	/** True while the placeholder is focused and no real block exists yet */
	isVirginFocused (rootId: string): boolean {
		return this.isActive && (this.rootId == rootId) && !this.realId && (focus.state.focused == this.id);
	};

	getBlock (): I.Block {
		return this.block;
	};

	activate (rootId: string, isPopup: boolean) {
		// A create may still be in flight from the previous activation — stash its
		// latest unsent text so the orphaned callback can persist it (see materialize)
		if (this.isCreating && this.pending) {
			this.orphans.set(this.generation, this.pending);
		};

		this.generation++;
		this.rootId = rootId;
		this.isPopup = isPopup;
		this.isActive = true;
		this.realId = '';
		this.isSwapped = false;
		this.isCreating = false;
		this.sentText = '';
		this.sentMarks = [];
		this.domAtSend = null;
		this.pending = null;
		this.cbQueue = [];
		this.unbindComposition();

		this.block = new M.Block({
			id: this.id,
			type: I.BlockType.Text,
			childrenIds: [],
			fields: {},
			content: { style: I.TextStyle.Paragraph, text: '', marks: [] },
		});
	};

	deactivate () {
		if (this.isCreating && this.pending) {
			this.orphans.set(this.generation, this.pending);
		};

		this.generation++;
		this.rootId = '';
		this.isActive = false;
		this.realId = '';
		this.isSwapped = false;
		this.isCreating = false;
		this.sentText = '';
		this.sentMarks = [];
		this.domAtSend = null;
		this.pending = null;
		this.cbQueue = [];
		this.block = null;
		this.unbindComposition();
	};

	/**
	 * Intercepted text write for the virtual id (called from U.Data.blockSetText).
	 * Empty text on a virgin placeholder is a no-op — nothing is ever created
	 * from focus/blur alone.
	 */
	setText (rootId: string, text: string, marks: I.Mark[], update: boolean, callBack?: (message: any) => void) {
		marks = marks || [];

		if (this.realId) {
			// Skip echoes of content the middleware already has (e.g. the debounced
			// keyup save re-sending exactly what BlockCreate carried)
			if ((text === this.sentText) && U.Common.compareJSON(marks, this.sentMarks)) {
				callBack?.({ blockId: this.realId, error: { code: 0 } });
				return;
			};

			this.sentText = text;
			this.sentMarks = marks;

			U.Data.blockSetText(rootId, this.realId, text, marks, update, callBack);
			return;
		};

		if (this.isCreating) {
			this.pending = { text, marks };
			if (callBack) {
				this.cbQueue.push(callBack);
			};
			return;
		};

		if (!text) {
			callBack?.({ error: { code: 0 } });
			return;
		};

		if (callBack) {
			this.cbQueue.push(callBack);
		};
		this.materialize(text, marks);
	};

	/**
	 * Materialization trigger for input that doesn't go through blockSetText
	 * (first keystroke, IME update, text drop, spellcheck replace). Reads the
	 * current DOM content of the placeholder editable.
	 */
	checkMaterialize () {
		if (!this.isActive || this.realId || this.isCreating) {
			return;
		};

		const data = this.readDom(this.id);
		if (!data || !data.text) {
			return;
		};

		this.materialize(data.text, data.marks);
	};

	private materialize (text: string, marks: I.Mark[]) {
		const rootId = this.rootId;
		const generation = this.generation;
		const param = {
			type: I.BlockType.Text,
			content: { style: I.TextStyle.Paragraph, text, marks },
		};

		this.isCreating = true;
		this.sentText = text;
		this.sentMarks = marks;
		this.domAtSend = this.readDom(this.id);

		C.BlockCreate(rootId, '', I.BlockPosition.Bottom, param, (message: any) => {
			// The placeholder was re-activated or closed while the request was in
			// flight — the block still lands in the document; persist any text that
			// was typed after the request was sent, then stand down
			if (generation != this.generation) {
				const orphan = this.orphans.get(generation);

				this.orphans.delete(generation);

				if (orphan && !message.error.code && message.blockId) {
					U.Data.blockSetText(rootId, message.blockId, orphan.text, orphan.marks, true);
				};
				return;
			};

			this.isCreating = false;

			if (message.error.code || !message.blockId) {
				// Keep the placeholder alive — the DOM still holds the user's text
				// and the next input retries the create
				this.drainQueue(message);
				return;
			};

			runInAction(() => {
				this.realId = message.blockId;
			});

			analytics.event('CreateBlock', {
				middleTime: message.middleTime,
				type: I.BlockType.Text,
				style: I.TextStyle.Paragraph,
				params: {},
			});

			if (keyboard.isComposition) {
				this.bindComposition();
			} else {
				this.finish();
			};
		});
	};

	/**
	 * Swaps the placeholder for the real block: syncs any text typed while the
	 * create was in flight, unmounts the virtual editable and applies focus to
	 * the real one in the same task so no keystrokes are lost.
	 */
	private finish () {
		const rootId = this.rootId;
		const realId = this.realId;

		if (!realId || this.isSwapped) {
			return;
		};

		const dom = this.readDom(this.id);
		const latest = this.domChangedSince(dom, this.domAtSend) ? dom : this.pending;

		this.pending = null;

		if (latest && ((latest.text !== this.sentText) || !U.Common.compareJSON(latest.marks, this.sentMarks))) {
			this.sentText = latest.text;
			this.sentMarks = latest.marks;

			U.Data.blockSetText(rootId, realId, latest.text, latest.marks, true);
		};

		const hadFocus = [ this.id, realId ].includes(focus.state.focused);
		const range = this.readRange(this.id) || { from: this.sentText.length, to: this.sentText.length };

		flushSync(() => {
			runInAction(() => {
				this.isActive = false;
				this.isSwapped = true;
			});
		});

		if (hadFocus) {
			focus.set(realId, range);
			focus.apply();
		};

		this.drainQueue({ blockId: realId, error: { code: 0 } });
	};

	private drainQueue (message: any) {
		const queue = this.cbQueue;

		this.cbQueue = [];
		this.runQueue(queue, message);
	};

	// ---------------------------------------------------------------------------
	// Identity forking for existing empty blocks (BlockReplace)
	// ---------------------------------------------------------------------------

	/**
	 * Whether the first content put into this block must fork its identity via
	 * BlockReplace instead of BlockTextSetText.
	 */
	shouldFork (rootId: string, block: I.Block, text: string): boolean {
		if (!text || !block || !block.isText()) {
			return false;
		};

		// Title/description are detail-backed and have fixed ids — the middleware
		// rejects replacing them
		if (block.isTextTitle() || block.isTextDescription()) {
			return false;
		};

		// Only blocks whose synced text is currently empty are shared registers
		if (block.getLength()) {
			return false;
		};

		// A previous BlockReplace was rejected for this block — degrade to SetText
		if (this.noFork.has(block.id)) {
			return false;
		};

		// Replacing a block with children would orphan them
		if (S.Block.getChildrenIds(rootId, block.id).length) {
			return false;
		};

		// Table cells have structurally derived ids and cannot change identity
		if (S.Block.checkIsInsideTable(rootId, block.id)) {
			return false;
		};

		return true;
	};

	/** True while a fork for this id is held (composition) or in flight */
	isForkPending (id: string): boolean {
		const fork = this.forks.get(id);
		return !!fork && !fork.newId;
	};

	/** Latest-wins buffering of writes that arrive while the fork is pending */
	forkSetText (id: string, text: string, marks: I.Mark[], callBack?: (message: any) => void) {
		const fork = this.forks.get(id);
		if (!fork) {
			return;
		};

		fork.pending = { text, marks: marks || [] };

		if (callBack) {
			fork.cbQueue.push(callBack);
		};
	};

	/**
	 * Forks the identity of an empty block: one BlockReplace carrying the new
	 * content plus everything the empty block already had. Held while an IME
	 * composition is active — replacing mid-composition would destroy the
	 * composition DOM.
	 */
	fork (rootId: string, block: I.Block, text: string, marks: I.Mark[], callBack?: (message: any) => void) {
		const oldId = block.id;
		const fork: Fork = {
			rootId,
			newId: '',
			sentText: text,
			sentMarks: marks || [],
			domAtSend: null,
			pending: null,
			cbQueue: callBack ? [ callBack ] : [],
		};

		this.forks.set(oldId, fork);

		if (keyboard.isComposition) {
			fork.pending = { text, marks: marks || [] };
			this.bindForkComposition(oldId);
			return;
		};

		this.sendFork(oldId);
	};

	private sendFork (oldId: string) {
		const fork = this.forks.get(oldId);
		if (!fork || fork.newId) {
			return;
		};

		const block = S.Block.getLeaf(fork.rootId, oldId);

		if (fork.pending) {
			fork.sentText = fork.pending.text;
			fork.sentMarks = fork.pending.marks;
			fork.pending = null;
		};

		// The block disappeared meanwhile, or was emptied again while the fork was
		// held — nothing to fork
		if (!block || !fork.sentText) {
			this.forks.delete(oldId);
			this.runQueue(fork.cbQueue, { error: { code: 0 } });
			return;
		};

		fork.domAtSend = this.readDom(oldId);

		const param = {
			type: I.BlockType.Text,
			bgColor: block.bgColor,
			hAlign: block.hAlign,
			vAlign: block.vAlign,
			fields: block.fields,
			content: {
				style: block.content.style,
				checked: block.content.checked,
				color: block.content.color,
				iconEmoji: block.content.iconEmoji,
				iconImage: block.content.iconImage,
				text: fork.sentText,
				marks: fork.sentMarks,
			},
		};

		C.BlockReplace(fork.rootId, oldId, param, (message: any) => {
			if (this.forks.get(oldId) !== fork) {
				return;
			};

			if (message.error.code || !message.blockId) {
				// Fall back to the plain write so the user's text still persists;
				// noFork prevents an immediate re-attempt loop for this block
				this.noFork.add(oldId);
				this.forks.delete(oldId);

				const latest = fork.pending || { text: fork.sentText, marks: fork.sentMarks };

				U.Data.blockSetText(fork.rootId, oldId, latest.text, latest.marks, true, (msg: any) => {
					this.runQueue(fork.cbQueue, msg);
				});
				return;
			};

			fork.newId = message.blockId;
			this.finishFork(oldId, fork);
		});
	};

	/**
	 * The response events already removed the old block and added the new one
	 * with the sent content. Sync anything typed while the request was in
	 * flight, then commit the re-render and move focus in the same task so no
	 * keystrokes land between the two editables.
	 */
	private finishFork (oldId: string, fork: Fork) {
		const dom = this.readDom(oldId);
		const latest = this.domChangedSince(dom, fork.domAtSend) ? dom : fork.pending;

		fork.pending = null;

		if (latest && ((latest.text !== fork.sentText) || !U.Common.compareJSON(latest.marks, fork.sentMarks))) {
			fork.sentText = latest.text;
			fork.sentMarks = latest.marks;

			U.Data.blockSetText(fork.rootId, fork.newId, latest.text, latest.marks, true);
		};

		const hadFocus = focus.state.focused == oldId;
		const range = this.readRange(oldId) || { from: fork.sentText.length, to: fork.sentText.length };

		if (hadFocus) {
			focus.set(fork.newId, range);
		};

		flushSync(() => {});

		if (hadFocus) {
			focus.apply();
		};

		const queue = fork.cbQueue;

		fork.cbQueue = [];
		this.runQueue(queue, { blockId: fork.newId, error: { code: 0 } });
		this.pruneForks();
	};

	private bindForkComposition (oldId: string) {
		const handler = () => {
			window.removeEventListener('compositionend', handler);

			// Let the block's own compositionend handlers settle the DOM first
			window.setTimeout(() => this.sendFork(oldId), 0);
		};

		window.addEventListener('compositionend', handler);
	};

	/** Completed fork mappings are kept for stale closures, but bounded */
	private pruneForks () {
		if (this.forks.size <= FORK_HISTORY_LIMIT) {
			return;
		};

		for (const [ id, fork ] of this.forks) {
			if (fork.newId) {
				this.forks.delete(id);
			};
			if (this.forks.size <= FORK_HISTORY_LIMIT) {
				break;
			};
		};
	};

	// ---------------------------------------------------------------------------
	// Shared helpers
	// ---------------------------------------------------------------------------

	private runQueue (queue: ((message: any) => void)[], message: any) {
		for (const cb of queue) {
			try {
				cb(message);
			} catch (e) {
				console.error('[VirtualBlock] queued callback error', e);
			};
		};
	};

	/**
	 * Whether the editable's DOM changed after the request was sent. The DOM is
	 * only authoritative for input made while the request was in flight:
	 * programmatic writes (e.g. paste as URL) never enter the editable, so an
	 * unchanged — typically still empty — DOM must not override the sent content.
	 */
	private domChangedSince (dom: { text: string; marks: I.Mark[]; }, snapshot: { text: string; marks: I.Mark[]; }): boolean {
		if (!dom) {
			return false;
		};

		const prev = snapshot || { text: '', marks: [] };
		return (dom.text !== prev.text) || !U.Common.compareJSON(dom.marks, prev.marks);
	};

	private getNode (id: string): HTMLElement {
		return U.Dom.select(`.focusable.c${U.Common.esc(id)}`);
	};

	private readDom (id: string): { text: string; marks: I.Mark[]; } {
		const node = this.getNode(id);
		if (!node) {
			return null;
		};

		const parsed = Mark.fromHtml(node.innerHTML || '', []);

		let text = String(parsed.text || '');
		if (text == '\n') {
			text = '';
		};

		return { text, marks: parsed.marks || [] };
	};

	private readRange (id: string): I.TextRange {
		const node = this.getNode(id);
		if (!node) {
			return null;
		};

		const range = getRange(node);
		if (!range) {
			return null;
		};

		if (Mark.hasZws(node)) {
			return {
				from: Mark.domToModel(range.start, node),
				to: Mark.domToModel(range.end, node),
			};
		};

		return { from: range.start, to: range.end };
	};

	private bindComposition () {
		if (this.compositionHandler) {
			return;
		};

		// Runs after the block's own compositionend handlers (window bubbles last),
		// so the editable DOM is settled when the swap reads it
		const handler = () => {
			this.unbindComposition();

			if (this.realId && !this.isSwapped) {
				this.finish();
			};
		};

		this.compositionHandler = handler;
		window.addEventListener('compositionend', handler);
	};

	private unbindComposition () {
		if (this.compositionHandler) {
			window.removeEventListener('compositionend', this.compositionHandler);
			this.compositionHandler = null;
		};
	};

};

export const virtualBlock = new VirtualBlock();
