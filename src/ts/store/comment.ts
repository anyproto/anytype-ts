import { observable, action, makeObservable, set, IObservableArray } from 'mobx';
import * as I from 'Interface';
import * as M from 'Model';
import { buildThreads, insertByOrder, newThreadIndex, placeMessage, ThreadIndex } from 'Lib/util/commentThread';

/** Per-discussion lookups. Not observable: components read the post and reply lists. */
interface DiscussionIndex {
	/** Every message the store holds for the discussion, including ones waiting for their parent. */
	byId: Map<string, M.CommentMessage>;
	thread: ThreadIndex<M.CommentMessage>;
};

/**
 * Object discussions: top-level posts per discussion subscription, and each post's thread
 * (replies flat, in orderId order) keyed by the post id. A reply to a reply sits in the
 * thread of the top-level post it leads to (see Lib/util/commentThread).
 */
class CommentStore {

	public postMap: Map<string, IObservableArray<M.CommentMessage>> = observable(new Map());
	public replyMap: Map<string, IObservableArray<M.CommentMessage>> = observable(new Map());
	private indexMap: Map<string, DiscussionIndex> = new Map();

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
	 * Replaces the discussion with a fully loaded message list. A message inserted live while the
	 * list was being fetched, and missing from it, is kept.
	 */
	load (subId: string, list: I.CommentMessage[]): void {
		const loaded = new Set((list || []).map(it => it.id));
		const live = [ ...(this.indexMap.get(subId)?.byId.values() || []) ].filter(it => !loaded.has(it.id));

		this.clear(subId);

		const index = this.getIndex(subId);
		const models = (list || []).concat(live).map(it => new M.CommentMessage(it));

		models.forEach(it => index.byId.set(it.id, it));

		const { posts, replies, index: thread } = buildThreads(models);

		index.thread = thread;
		this.postMap.set(subId, observable.array(posts, { deep: false }));
		replies.forEach((list, rootId) => this.replyMap.set(rootId, observable.array(list, { deep: false })));
	};

	/** Adds a live message to its list in order; a message the store already holds is ignored. */
	insert (subId: string, message: I.CommentMessage): void {
		const index = this.getIndex(subId);

		if (index.byId.has(message.id)) {
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
	};

	update (subId: string, param: Partial<I.CommentMessage>): void {
		const item = this.getById(subId, param.id);

		if (item) {
			set(item, param);
		};
	};

	/** Turns a comment into a tombstone in place, the way heart stores a deleted discussion comment. */
	markDeleted (subId: string, id: string): void {
		this.update(subId, {
			id,
			isDeleted: true,
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
		const item = index?.byId.get(id);

		if (!item) {
			return;
		};

		index.byId.delete(id);

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

		const list = (rootId == id) ? this.postMap.get(subId) : this.replyMap.get(rootId);
		list?.remove(item);
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
			new Set(index.thread.roots.values()).forEach(rootId => this.replyMap.delete(rootId));
		};

		this.postMap.delete(subId);
		this.indexMap.delete(subId);
	};

	clearAll (): void {
		this.postMap.clear();
		this.replyMap.clear();
		this.indexMap.clear();
	};

	private getIndex (subId: string): DiscussionIndex {
		let index = this.indexMap.get(subId);

		if (!index) {
			index = { byId: new Map(), thread: newThreadIndex() };
			this.indexMap.set(subId, index);
		};

		return index;
	};

};

export const Comment: CommentStore = new CommentStore();
