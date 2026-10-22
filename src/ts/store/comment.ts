import { observable, action, makeObservable, set, IObservableArray } from 'mobx';
import * as I from 'Interface';
import * as M from 'Model';
import { buildThreads, insertByOrder, newThreadIndex, placeMessage, ThreadIndex } from 'Lib/util/commentThread';

type JournalEntry = { update: Partial<I.CommentMessage> } | { remove: string };

/** A subscribed discussion's lookups. Not observable: components read the post and reply lists. */
interface DiscussionIndex {
	/** Every message the store holds for the discussion, including ones waiting for their parent. */
	byId: Map<string, M.CommentMessage>;
	thread: ThreadIndex<M.CommentMessage>;
	/** The pending load's token, 0 once loaded. */
	loadToken: number;
	/** Updates and removals made while the pages were loading, replayed over the loaded copies. */
	journal: JournalEntry[];
};

/**
 * Object discussions: top-level posts per discussion subscription, and each post's thread
 * (replies flat, in orderId order) keyed by the post id. A reply to a reply sits in the
 * thread of the top-level post it leads to (see Lib/util/commentThread).
 *
 * A discussion exists from startLoad (on subscribe) until clear (on unsubscribe); events for
 * one that is not subscribed are dropped.
 */
class CommentStore {

	public postMap: Map<string, IObservableArray<M.CommentMessage>> = observable(new Map());
	public replyMap: Map<string, IObservableArray<M.CommentMessage>> = observable(new Map());
	/** Bumped whenever messages are placed or dropped, so getThreadRoot callers re-resolve. */
	private layoutMap: Map<string, number> = observable(new Map());
	private indexMap: Map<string, DiscussionIndex> = new Map();
	private loadSeq = 0;

	constructor () {
		makeObservable(this, {
			load: action,
			insert: action,
			update: action,
			markDeleted: action,
			remove: action,
			setReadMessageStatus: action,
			setReadMentionStatus: action,
			setSyncStatus: action,
			clear: action,
			clearAll: action,
		});
	};

	/**
	 * Opens a discussion before its pages are fetched, so live events are kept from now on.
	 * Returns the token the matching load must pass.
	 */
	startLoad (subId: string): number {
		let index = this.indexMap.get(subId);

		if (!index) {
			index = { byId: new Map(), thread: newThreadIndex(), loadToken: 0, journal: [] };
			this.indexMap.set(subId, index);
		};

		index.loadToken = ++this.loadSeq;
		index.journal = [];
		return index.loadToken;
	};

	/**
	 * Lays out the fully loaded message list. A load for a discussion that was closed or opened
	 * again since its startLoad is dropped. A message inserted live and missing from the pages
	 * is kept; updates and removals made while loading are replayed over the loaded copies.
	 * Returns whether the load was applied.
	 */
	load (subId: string, list: I.CommentMessage[], token: number): boolean {
		const index = this.indexMap.get(subId);

		if (!index || !token || (index.loadToken != token)) {
			return false;
		};

		// One instance per id, the loaded copy first, so lookups and lists share it
		const byId = new Map<string, M.CommentMessage>();
		for (const it of (list || [])) {
			if (!byId.has(it.id)) {
				byId.set(it.id, new M.CommentMessage(it));
			};
		};
		index.byId.forEach((it, id) => {
			if (!byId.has(id)) {
				byId.set(id, it);
			};
		});

		this.dropLists(subId, index);

		const { posts, replies, index: thread } = buildThreads([ ...byId.values() ]);
		const journal = index.journal;

		this.indexMap.set(subId, { byId, thread, loadToken: 0, journal: [] });
		this.postMap.set(subId, observable.array(posts, { deep: false }));
		replies.forEach((list, rootId) => this.replyMap.set(rootId, observable.array(list, { deep: false })));

		journal.forEach(entry => {
			if ('update' in entry) {
				this.update(subId, entry.update);
			} else {
				this.remove(subId, entry.remove);
			};
		});

		this.bumpLayout(subId);
		return true;
	};

	/**
	 * Adds a live message to its list in order. For a message the store already holds, only an
	 * order id it lacked is taken: an own message is inserted before its ChatAdd event, and the
	 * ChatAddMessage response carries no order id.
	 */
	insert (subId: string, message: I.CommentMessage): void {
		const index = this.indexMap.get(subId);

		if (!index) {
			return;
		};

		const existing = index.byId.get(message.id);
		if (existing) {
			if (!existing.orderId && message.orderId) {
				set(existing, { orderId: message.orderId });
				this.reposition(subId, index, existing);
			};
			return;
		};

		const model = new M.CommentMessage(message);
		index.byId.set(model.id, model);

		for (const { message: placed, rootId } of placeMessage(index.thread, model)) {
			const isPost = rootId == placed.id;
			const map = isPost ? this.postMap : this.replyMap;
			const key = isPost ? subId : rootId;

			let list = map.get(key);
			if (!list) {
				list = observable.array([], { deep: false });
				map.set(key, list);
			};

			insertByOrder(list, placed);
		};

		this.bumpLayout(subId);
	};

	update (subId: string, param: Partial<I.CommentMessage>): void {
		const index = this.indexMap.get(subId);

		if (!index) {
			return;
		};

		if (index.loadToken) {
			index.journal.push({ update: param });
		};

		const item = index.byId.get(param.id);
		if (item) {
			set(item, param);
		};
	};

	/** Turns a comment into a tombstone in place, the way heart stores a deleted discussion comment. */
	markDeleted (subId: string, id: string): void {
		this.update(subId, {
			id,
			isDeleted: true,
			isReadMessage: true,
			isReadMention: true,
			modifiedAt: 0,
			content: { text: '', style: I.TextStyle.Paragraph, marks: [], parts: [] },
			attachments: [],
			reactions: [],
		});
	};

	/**
	 * Drops a hard-deleted message (space chats, or a heart without discussion tombstones). It
	 * stays in the thread index, so a later reply to it still lands in its thread.
	 */
	remove (subId: string, id: string): void {
		const index = this.indexMap.get(subId);

		if (!index) {
			return;
		};

		if (index.loadToken) {
			index.journal.push({ remove: id });
		};

		const item = index.byId.get(id);
		if (!item) {
			return;
		};

		index.byId.delete(id);
		this.bumpLayout(subId);

		const rootId = index.thread.roots.get(id);
		if (rootId === undefined) {
			index.thread.pending.forEach(list => {
				const idx = list.indexOf(item);
				if (idx >= 0) {
					list.splice(idx, 1);
				};
			});
			return;
		};

		this.getList(subId, rootId, id)?.remove(item);
	};

	getPosts (subId: string): M.CommentMessage[] {
		return this.postMap.get(subId) || [];
	};

	getReplies (rootId: string): M.CommentMessage[] {
		return this.replyMap.get(rootId) || [];
	};

	getById (subId: string, id: string): M.CommentMessage | undefined {
		return this.indexMap.get(subId)?.byId.get(id);
	};

	/**
	 * Id of the top-level post whose thread holds a stored, placed message (a post's own id),
	 * or undefined. Observable: callers re-run when messages are placed or dropped.
	 */
	getThreadRoot (subId: string, id: string): string | undefined {
		this.layoutMap.get(subId);

		const index = this.indexMap.get(subId);
		if (!id || !index?.byId.has(id)) {
			return undefined;
		};

		return index.thread.roots.get(id);
	};

	setReadMessageStatus (subId: string, ids: string[], value: boolean): void {
		(ids || []).forEach(id => this.update(subId, { id, isReadMessage: value }));
	};

	setReadMentionStatus (subId: string, ids: string[], value: boolean): void {
		(ids || []).forEach(id => this.update(subId, { id, isReadMention: value }));
	};

	setSyncStatus (subId: string, ids: string[], value: boolean): void {
		(ids || []).forEach(id => this.update(subId, { id, isSynced: value }));
	};

	clear (subId: string): void {
		const index = this.indexMap.get(subId);

		if (index) {
			this.dropLists(subId, index);
		};

		this.postMap.delete(subId);
		this.indexMap.delete(subId);
		this.layoutMap.delete(subId);
	};

	clearAll (): void {
		this.postMap.clear();
		this.replyMap.clear();
		this.indexMap.clear();
		this.layoutMap.clear();
	};

	private bumpLayout (subId: string): void {
		this.layoutMap.set(subId, (this.layoutMap.get(subId) || 0) + 1);
	};

	/** The list a placed message sits in: the posts, or its thread's replies. */
	private getList (subId: string, rootId: string, id: string): IObservableArray<M.CommentMessage> | undefined {
		return (rootId == id) ? this.postMap.get(subId) : this.replyMap.get(rootId);
	};

	private reposition (subId: string, index: DiscussionIndex, item: M.CommentMessage): void {
		const rootId = index.thread.roots.get(item.id);
		const list = (rootId === undefined) ? undefined : this.getList(subId, rootId, item.id);

		if (list && list.remove(item)) {
			insertByOrder(list, item);
		};
	};

	private dropLists (subId: string, index: DiscussionIndex): void {
		new Set(index.thread.roots.values()).forEach(rootId => this.replyMap.delete(rootId));
		this.postMap.delete(subId);
	};

};

export const Comment: CommentStore = new CommentStore();
