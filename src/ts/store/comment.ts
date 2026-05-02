import { observable, action, makeObservable, set } from 'mobx';
import * as I from 'Interface';
import * as M from 'Model';

class CommentStore {

	public postMap: Map<string, I.CommentMessage[]> = observable(new Map());
	public replyMap: Map<string, I.CommentMessage[]> = observable(new Map());
	private hasMorePostsMap: Map<string, boolean> = observable(new Map());
	private hasMoreRepliesMap: Map<string, boolean> = observable(new Map());
	private hasOlderRepliesMap: Map<string, boolean> = observable(new Map());

	constructor () {
		makeObservable(this, {
			setPosts: action,
			prependPosts: action,
			appendPosts: action,
			addPost: action,
			updatePost: action,
			deletePost: action,
			setReplies: action,
			prependReplies: action,
			appendReplies: action,
			addReply: action,
			updateReply: action,
			deleteReply: action,
			setReadMessageStatus: action,
			setReadMentionStatus: action,
			setSyncStatus: action,
			setHasMorePosts: action,
			setHasMoreReplies: action,
			setHasOlderReplies: action,
			clear: action,
			clearAll: action,
		});
	};

	setPosts (subId: string, list: I.CommentMessage[]): void {
		list = list.map(it => new M.CommentMessage(it));
		list = U.Common.arrayUniqueObjects(list, 'id');

		this.postMap.set(subId, observable.array(list));
	};

	prependPosts (subId: string, add: I.CommentMessage[]): void {
		const ids = new Set(this.getPosts(subId).map(it => it.id));

		add = (add || []).filter(it => !ids.has(it.id));
		add = add.map(it => new M.CommentMessage(it));

		this.getPosts(subId).unshift(...add);
	};

	appendPosts (subId: string, add: I.CommentMessage[]): void {
		const ids = new Set(this.getPosts(subId).map(it => it.id));

		add = (add || []).filter(it => !ids.has(it.id));
		add = add.map(it => new M.CommentMessage(it));

		this.getPosts(subId).push(...add);
	};

	addPost (subId: string, post: I.CommentMessage): void {
		const list = this.getPosts(subId);
		const existing = list.find(it => it.id == post.id);

		if (existing) {
			return;
		};

		list.push(new M.CommentMessage(post));
		this.postMap.set(subId, observable.array(list));
	};

	updatePost (subId: string, param: Partial<I.CommentMessage>): void {
		const item = this.getPostById(subId, param.id);

		if (item) {
			set(item, param);
		};
	};

	deletePost (subId: string, id: string): void {
		this.replyMap.delete(id);
		this.hasMoreRepliesMap.delete(id);
		this.setPosts(subId, this.getPosts(subId).filter(it => it.id != id));
	};

	getPosts (subId: string): I.CommentMessage[] {
		return this.postMap.get(subId) || [];
	};

	getPostById (subId: string, id: string): I.CommentMessage {
		return this.getPosts(subId).find(it => it.id == id);
	};

	setReplies (parentId: string, list: I.CommentMessage[]): void {
		list = list.map(it => new M.CommentMessage(it));
		list = U.Common.arrayUniqueObjects(list, 'id');

		this.replyMap.set(parentId, observable.array(list));
	};

	prependReplies (parentId: string, add: I.CommentMessage[]): void {
		const ids = new Set(this.getReplies(parentId).map(it => it.id));

		add = (add || []).filter(it => !ids.has(it.id));
		add = add.map(it => new M.CommentMessage(it));

		this.getReplies(parentId).unshift(...add);
	};

	appendReplies (parentId: string, add: I.CommentMessage[]): void {
		const ids = new Set(this.getReplies(parentId).map(it => it.id));

		add = (add || []).filter(it => !ids.has(it.id));
		add = add.map(it => new M.CommentMessage(it));

		this.getReplies(parentId).push(...add);
	};

	addReply (parentId: string, reply: I.CommentMessage): void {
		const list = this.getReplies(parentId);
		const existing = list.find(it => it.id == reply.id);

		if (existing) {
			return;
		};

		list.push(new M.CommentMessage(reply));
		this.replyMap.set(parentId, observable.array(list));
	};

	updateReply (parentId: string, param: Partial<I.CommentMessage>): void {
		const item = this.getReplies(parentId).find(it => it.id == param.id);

		if (item) {
			set(item, param);
		};
	};

	deleteReply (parentId: string, id: string): void {
		this.setReplies(parentId, this.getReplies(parentId).filter(it => it.id != id));
	};

	private updateInPostOrReply (subId: string, id: string, param: Partial<I.CommentMessage>): void {
		const post = this.getPostById(subId, id);
		if (post) {
			set(post, param);
			return;
		};

		this.replyMap.forEach((list, parentId) => {
			const reply = list.find(it => it.id == id);
			if (reply) {
				set(reply, param);
			};
		});
	};

	setReadMessageStatus (subId: string, ids: string[], value: boolean): void {
		(ids || []).forEach(id => this.updateInPostOrReply(subId, id, { isReadMessage: value }));
	};

	setReadMentionStatus (subId: string, ids: string[], value: boolean): void {
		(ids || []).forEach(id => this.updateInPostOrReply(subId, id, { isReadMention: value }));
	};

	setSyncStatus (subId: string, ids: string[], value: boolean): void {
		(ids || []).forEach(id => this.updateInPostOrReply(subId, id, { isSynced: value }));
	};

	getReplies (parentId: string): I.CommentMessage[] {
		return this.replyMap.get(parentId) || [];
	};

	setHasMorePosts (subId: string, value: boolean): void {
		this.hasMorePostsMap.set(subId, value);
	};

	getHasMorePosts (subId: string): boolean {
		return this.hasMorePostsMap.get(subId) || false;
	};

	setHasMoreReplies (parentId: string, value: boolean): void {
		this.hasMoreRepliesMap.set(parentId, value);
	};

	getHasMoreReplies (parentId: string): boolean {
		return this.hasMoreRepliesMap.get(parentId) || false;
	};

	setHasOlderReplies (parentId: string, value: boolean): void {
		this.hasOlderRepliesMap.set(parentId, value);
	};

	getHasOlderReplies (parentId: string): boolean {
		return this.hasOlderRepliesMap.get(parentId) || false;
	};

	clear (subId: string): void {
		const posts = this.getPosts(subId);
		for (const post of posts) {
			this.replyMap.delete(post.id);
			this.hasMoreRepliesMap.delete(post.id);
			this.hasOlderRepliesMap.delete(post.id);
		};

		this.postMap.delete(subId);
		this.hasMorePostsMap.delete(subId);
	};

	clearAll (): void {
		this.postMap.clear();
		this.replyMap.clear();
		this.hasMorePostsMap.clear();
		this.hasMoreRepliesMap.clear();
		this.hasOlderRepliesMap.clear();
	};

};

export const Comment: CommentStore = new CommentStore();
