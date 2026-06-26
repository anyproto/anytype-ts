import { observable, action, makeObservable, set, autorun } from 'mobx';
import * as I from 'Interface';
import * as M from 'Model';
import { evictedCount, shouldSuppressLiveAdd } from 'Lib/util/chatWindow';

const MAX_MESSAGES = 500;

class ChatStore {

	public messageMap: Map<string, any[]> = observable(new Map());
	public replyMap: Map<string, Map<string, I.ChatMessage>> = observable(new Map());
	public stateMap: Map<string, Map<string, I.ChatStoreState>> = observable.map(new Map());
	public attachmentsMap: Map<string, any[]> = observable(new Map());
	public discussionParentMap: Map<string, Map<string, string>> = observable.map(new Map());
	private badgeValue = '';
	private atChatStartMap: Map<string, boolean> = new Map();
	private atChatEndMap: Map<string, boolean> = new Map();
	private messageByIdMap: Map<string, Map<string, any>> = new Map();

	constructor () {
		makeObservable(this, {
			add: action,
			update: action,
			delete: action,
			setReply: action,
			setState: action,
			setAttachments: action,
			discussionParentMapSet: action,
			discussionParentMapDelete: action,
		});

		queueMicrotask(() => autorun(() => this.setBadge()));
	};

	/**
	 * Sets the chat message list for a subId.
	 * @param {string} subId - The subscription ID.
	 * @param {I.ChatMessage[]} list - The chat messages.
	 */
	set (subId: string, list: I.ChatMessage[]): void {
		list = list.map(it => new M.ChatMessage(it));
		list = U.Common.arrayUniqueObjects(list, 'id');

		this.messageMap.set(subId, observable.array(list));
		this.rebuildIndex(subId);
	};

	/**
	 * Rebuilds the per-subId id→message index from the current list, for O(1) getMessageById.
	 * Cheap (≤ MAX_MESSAGES) and only runs on list-changing operations (set / prepend / append),
	 * never per render or per scroll frame.
	 * @param {string} subId - The subscription ID.
	 */
	private rebuildIndex (subId: string): void {
		const list = this.getList(subId);
		this.messageByIdMap.set(subId, new Map(list.map((it: any) => [ it.id, it ])));
	};

	/**
	 * Prepends chat messages to the list for a subId.
	 * @param {string} subId - The subscription ID.
	 * @param {I.ChatMessage[]} add - The chat messages to prepend.
	 */
	prepend (subId: string, add: I.ChatMessage[]): boolean {
		const list = this.getList(subId);
		const ids = new Set(list.map(it => it.id));

		add = (add || []).filter(it => !ids.has(it.id));
		add = add.map(it => new M.ChatMessage(it));

		list.unshift(...add);

		const evicted = evictedCount(list.length, MAX_MESSAGES);
		if (evicted) {
			list.splice(MAX_MESSAGES);
			this.setAtChatEnd(subId, false);
		};

		this.rebuildIndex(subId);
		return evicted > 0;
	};

	/**
	 * Appends chat messages to the list for a subId.
	 * @param {string} subId - The subscription ID.
	 * @param {I.ChatMessage[]} add - The chat messages to append.
	 */
	append (subId: string, add: I.ChatMessage[]): boolean {
		const list = this.getList(subId);
		const ids = new Set(list.map(it => it.id));

		add = (add || []).filter(it => !ids.has(it.id));
		add = add.map(it => new M.ChatMessage(it));

		list.push(...add);

		const evicted = evictedCount(list.length, MAX_MESSAGES);
		if (evicted) {
			list.splice(0, evicted);
			this.setAtChatStart(subId, false);
		};

		this.rebuildIndex(subId);
		return evicted > 0;
	};

	/**
	 * Adds a chat message at a specific index.
	 * @param {string} subId - The subscription ID.
	 * @param {number} idx - The index to insert at.
	 * @param {I.ChatMessage} param - The chat message to add.
	 */
	add (subId: string, idx: number, param: I.ChatMessage): void {
		const list = this.getList(subId);
		const item = this.getMessageById(subId, param.id);

		if (item) {
			return;
		};

		const isTail = idx >= list.length;

		// A genuinely-newer live message while the window is not at the chat end would land
		// after an evicted tail (out of order). Suppress it; it is fetched on scroll-down /
		// jump-to-bottom. Non-open and preview subIds keep atChatEnd === true (default).
		if (isTail) {
			const last = list.length ? list[list.length - 1] : null;
			if (shouldSuppressLiveAdd(this.isAtChatEnd(subId), param.orderId, last ? last.orderId : '')) {
				return;
			};
		};

		list.splice(idx, 0, param);

		// Tail insert behaves like append: trim the oldest head if over the cap.
		if (isTail) {
			const evicted = evictedCount(list.length, MAX_MESSAGES);
			if (evicted) {
				list.splice(0, evicted);
				this.setAtChatStart(subId, false);
			};
		};

		this.set(subId, list);
	};

	/**
	 * Updates a chat message by ID.
	 * @param {string} subId - The subscription ID.
	 * @param {Partial<I.ChatMessage>} param - The chat message update.
	 */
	update (subId: string, param: Partial<I.ChatMessage>): void {
		const item = this.getMessageById(subId, param.id);

		if (item) {
			set(item, param);
		};
	};

	/**
	 * Deletes a chat message by ID.
	 * @param {string} subId - The subscription ID.
	 * @param {string} id - The chat message ID.
	 */
	delete (subId: string, id: string) {
		this.set(subId, this.getList(subId).filter(it => it.id != id));
	};

	/**
	 * Sets a reply message for a subId.
	 * @param {string} subId - The subscription ID.
	 * @param {I.ChatMessage} message - The reply message.
	 */
	setReply (subId: string, message: I.ChatMessage) {
		const map = this.replyMap.get(subId) || new Map();

		map.set(message.id, message);

		this.replyMap.set(subId, map);
	};

	/**
	 * Sets the read status for messages by IDs.
	 * @param {string} subId - The subscription ID.
	 * @param {string[]} ids - The message IDs.
	 * @param {boolean} value - The read status value.
	 */
	setReadMessageStatus (subId: string, ids: string[], value: boolean) {
		(ids || []).forEach(id => this.update(subId, { id, isReadMessage: value }));
	};

	/**
	 * Sets the read mention status for messages by IDs.
	 * @param {string} subId - The subscription ID.
	 * @param {string[]} ids - The message IDs.
	 * @param {boolean} value - The read mention status value.
	 */
	setReadMentionStatus (subId: string, ids: string[], value: boolean) {
		(ids || []).forEach(id => this.update(subId, { id, isReadMention: value }));
	};

	/**
	 * Sets the synced status for messages by IDs.
	 * @param {string} subId - The subscription ID.
	 * @param {string[]} ids - The message IDs.
	 * @param {boolean} value - The read mention status value.
	 */
	setSyncStatus (subId: string, ids: string[], value: boolean) {
		(ids || []).forEach(id => this.update(subId, { id, isSynced: value }));
	};

	/**
	 * Sets the read reaction status for messages by IDs.
	 * @param {string} subId - The subscription ID.
	 * @param {string[]} ids - The message IDs.
	 * @param {boolean} value - The read reaction status value.
	 */
	setReadReactionStatus (subId: string, ids: string[], value: boolean) {
		(ids || []).forEach(id => this.update(subId, { id, isReadReaction: value }));
	};

	/**
	 * Creates a chat state object with observables.
	 * @private
	 * @param {I.ChatState} state - The chat state input.
	 * @returns {ChatState} The created chat state object.
	 */
	private createState (state: I.ChatState): I.ChatStoreState {
		const { messages, mentions, reactionOrderId, lastStateId, order } = state;

		const el = {
			messageOrderId: messages.orderId,
			messageCounter: messages.counter,
			mentionOrderId: mentions.orderId,
			mentionCounter: mentions.counter,
			reactionOrderId,
			reactionCounter: reactionOrderId ? 1 : 0,
			lastStateId,
			order,
		};

		makeObservable(el, {
			messageOrderId: observable,
			messageCounter: observable,
			mentionOrderId: observable,
			mentionCounter: observable,
			reactionOrderId: observable,
			reactionCounter: observable,
			lastStateId: observable,
			order: observable,
		});

		return el;
	};

	/**
	 * Parses a subId into its components.
	 * @private
	 * @param {string} subId - The subscription ID.
	 * @returns {{ prefix: string; spaceId: string; chatId: string; tabId: string }} The parsed parameters.
	 */
	private getSubParam (subId: string): { prefix: string; spaceId: string; chatId: string; tabId: string } {
		subId = String(subId || '');

		const [ prefix, spaceId, chatId, tabId ] = subId.split('-');

		if (prefix == J.Constant.subId.chatSpace) {
			return { prefix, spaceId, chatId, tabId };
		} else {
			const [ rootId, blockId ] = chatId.split(':');
			return { prefix: '', spaceId, chatId: rootId, tabId };
		};
	};

	/**
	 * Gets the subscription ID for a space and chat.
	 * @param {string} spaceId - The space ID.
	 * @returns {string} The subscription ID.
	 */
	getSpaceSubId (spaceId: string): string {
		return [ J.Constant.subId.chatSpace, spaceId, '', S.Common.tabId ].join('-');
	};

	/**
	 * Gets the subscription ID for a space and chat.
	 * @param {string} spaceId - The space ID.	
	 * @param {string} chatId - The chat ID.
	 * @returns {string} The subscription ID.
	 */
	getChatSubId (prefix: string, spaceId: string, chatId: string): string {
		return [ prefix, spaceId, `${chatId}:${J.Constant.blockId.chat}`, S.Common.tabId ].join('-');
	};

	/**
	 * Sets the chat state for a subId.
	 * @param {string} subId - The subscription ID.
	 * @param {I.ChatState} state - The chat state.
	 */
	setState (subId: string, state: I.ChatState) {
		const param = this.getSubParam(subId);
		const spaceMap = this.stateMap.get(param.spaceId) || new Map();
		const current = spaceMap.get(param.chatId);

		if (current) {
			const { messages, mentions, reactionOrderId, lastStateId, order } = state;

			// Ignore outdated state
			if (current.order && order && (order < current.order)) {
				return;
			};

			set(current, {
				messageOrderId: messages.orderId,
				messageCounter: messages.counter,
				mentionOrderId: mentions.orderId,
				mentionCounter: mentions.counter,
				reactionOrderId,
				reactionCounter: reactionOrderId ? 1 : 0,
				lastStateId,
				order,
			});
		} else {
			spaceMap.set(param.chatId, this.createState(state));
		};

		this.stateMap.set(param.spaceId, spaceMap);
		this.setBadge();
	};

	/**
	 * Gets the chat state for a subId.
	 * @param {string} subId - The subscription ID.
	 * @returns {ChatState} The chat state.
	 */
	getState (subId: string): I.ChatStoreState {
		const param = this.getSubParam(subId);
		const ret = {
			messageOrderId: '',
			messageCounter: 0,
			mentionOrderId: '',
			mentionCounter: 0,
			reactionOrderId: '',
			reactionCounter: 0,
			lastStateId: '',
			order: 0,
		};

		return Object.assign(ret, this.stateMap.get(param.spaceId)?.get(param.chatId) || {});
	};

	/**
	 * Clears all chat data for a subId.
	 * @param {string} subId - The subscription ID.
	 */
	clear (subId: string) {
		this.messageMap.delete(subId);
		this.replyMap.delete(subId);
		this.attachmentsMap.delete(subId);
		this.atChatStartMap.delete(subId);
		this.atChatEndMap.delete(subId);
		this.messageByIdMap.delete(subId);
	};

	/**
	 * Whether the window's first message is the chat's oldest. Default true (untracked subId).
	 * @param {string} subId - The subscription ID.
	 */
	isAtChatStart (subId: string): boolean {
		const v = this.atChatStartMap.get(subId);
		return v === undefined ? true : v;
	};

	/**
	 * Whether the window's last message is the chat's newest. Default true (untracked subId).
	 * @param {string} subId - The subscription ID.
	 */
	isAtChatEnd (subId: string): boolean {
		const v = this.atChatEndMap.get(subId);
		return v === undefined ? true : v;
	};

	/**
	 * Sets whether the window is anchored at the chat's oldest message.
	 * @param {string} subId - The subscription ID.
	 * @param {boolean} v - The value.
	 */
	setAtChatStart (subId: string, v: boolean): void {
		this.atChatStartMap.set(subId, v);
	};

	/**
	 * Sets whether the window is anchored at the chat's newest message.
	 * @param {string} subId - The subscription ID.
	 * @param {boolean} v - The value.
	 */
	setAtChatEnd (subId: string, v: boolean): void {
		this.atChatEndMap.set(subId, v);
	};

	/**
	 * Clears all chat data in the store.
	 */
	clearAll () {
		this.messageMap.clear();
		this.replyMap.clear();
		this.stateMap.clear();
		this.attachmentsMap.clear();
		this.discussionParentMap.clear();
		this.atChatStartMap.clear();
		this.atChatEndMap.clear();
		this.messageByIdMap.clear();
	};

	/**
	 * Gets the chat message list for a subId.
	 * @param {string} subId - The subscription ID.
	 * @returns {any[]} The chat messages.
	 */
	getList (subId: string): any[] {
		return this.messageMap.get(subId) || [];
	};

	/**
	 * Gets a chat message by ID.
	 * @param {string} subId - The subscription ID.
	 * @param {string} id - The chat message ID.
	 * @returns {I.ChatMessage} The chat message.
	 */
	getMessageById (subId: string, id: string): I.ChatMessage {
		// Read the observable list FIRST so observer callers (Message rows) keep a MobX dependency
		// on the message map key. set()/add()/delete() replace the array with freshly-wrapped
		// M.ChatMessage instances; without this read a memoized observer row bound to a now-detached
		// instance would stop reflecting reactions/edits/read-status/grouping. The map is the O(1)
		// accelerator for the actual lookup.
		const list = this.getList(subId);
		return this.messageByIdMap.get(subId)?.get(id) || list.find(it => it.id == id);
	};

	/**
	 * Gets a chat message by order ID.
	 * @param {string} subId - The subscription ID.
	 * @param {string} orderId - The chat message order ID.
	 * @returns {I.ChatMessage} The chat message.
	 */
	getMessageByOrderId (subId: string, orderId: string): I.ChatMessage {
		return this.getList(subId).find(it => it.orderId == orderId);
	};

	/**
	 * Gets a reply message by ID.
	 * @param {string} subId - The subscription ID.
	 * @param {string} id - The reply message ID.
	 * @returns {I.ChatMessage} The reply message.
	 */
	getReply (subId: string, id: string): I.ChatMessage {
		return this.replyMap.get(subId)?.get(id);
	};

	/**
	 * Gets the total mention and message counters for all spaces.
	 * @returns {Counter} The total counters.
	 */
	getTotalCounters (): I.ChatCounter {
		const spaces = U.Space.getList();
		const ret = { mentionCounter: 0, messageCounter: 0, reactionCounter: 0 };

		if (!spaces.length) {
			return ret;
		};

		for (const space of spaces) {
			const spaceId = space.targetSpaceId;
			const spaceview = U.Space.getSpaceviewBySpaceId(spaceId);
			if (!spaceview) {
				continue;
			};

			this.aggregateSpaceCounters(ret, spaceId, spaceview, false);
		};

		return ret;
	};

	/**
	 * Adds counters from chats (stateMap) and discussions (parent details) for a space
	 * into the provided accumulator. Used by both getTotalCounters and getSpaceCounters.
	 */
	private aggregateSpaceCounters (acc: I.ChatCounter, spaceId: string, spaceview: any, ignoreMute: boolean): void {
		const spaceMap = this.stateMap.get(spaceId);
		const discussionMap = this.discussionParentMap.get(spaceId);

		if (spaceMap) {
			for (const [ chatId, state ] of spaceMap) {
				if (!chatId || this.isStateEntryArchived(spaceId, chatId)) {
					continue;
				};

				if (discussionMap?.has(chatId)) {
					continue;
				};

				const chatMode = U.Object.getChatNotificationMode(spaceview, chatId);

				if (state.mentionCounter && (ignoreMute || [ I.NotificationMode.All, I.NotificationMode.Mentions ].includes(chatMode))) {
					acc.mentionCounter += Number(state.mentionCounter) || 0;
				};

				if (state.messageCounter && (ignoreMute || [ I.NotificationMode.All, I.NotificationMode.Mentions ].includes(chatMode))) {
					acc.messageCounter += Number(state.messageCounter) || 0;
				};

				if (state.reactionCounter && (ignoreMute || [ I.NotificationMode.All, I.NotificationMode.Mentions ].includes(chatMode))) {
					acc.reactionCounter += Number(state.reactionCounter) || 0;
				};
			};
		};

		if (discussionMap) {
			for (const [ , parentId ] of discussionMap) {
				const parent = this.getDiscussionParentDetail(spaceId, parentId, [ 'unreadMessageCount', 'unreadMentionCount', 'isArchived' ]);
				if (parent._empty_ || parent.isArchived) {
					continue;
				};

				const chatMode = U.Object.getDiscussionNotificationMode(spaceview, parentId);
				const mentionCount = Number(parent.unreadMentionCount) || 0;
				const messageCount = Number(parent.unreadMessageCount) || 0;

				if (mentionCount && (ignoreMute || [ I.NotificationMode.All, I.NotificationMode.Mentions ].includes(chatMode))) {
					acc.mentionCounter += mentionCount;
				};

				if (messageCount && (ignoreMute || [ I.NotificationMode.All, I.NotificationMode.Mentions ].includes(chatMode))) {
					acc.messageCounter += messageCount;
				};
			};
		};
	};

	/**
	 * Gets the mention and message counters for a space.
	 * @param {string} spaceId - The space ID.
	 * @param {boolean} [ignoreMute] - If true, include counters regardless of notification mode.
	 * @returns {I.ChatCounter} The counters for the space.
	 */
	getSpaceCounters (spaceId: string, ignoreMute?: boolean): I.ChatCounter {
		const ret = { mentionCounter: 0, messageCounter: 0, reactionCounter: 0 };
		const spaceview = U.Space.getSpaceviewBySpaceId(spaceId);

		if (!spaceview) {
			return ret;
		};

		this.aggregateSpaceCounters(ret, spaceId, spaceview, !!ignoreMute);
		return ret;
	};

	/**
	 * Gets the last message for a space.
	 * @param {string} spaceId - The space ID.
	 * @returns {I.ChatMessage | null} The last message.
	 */
	getSpaceLastMessage (spaceId: string): I.ChatMessage | null {
		const list = this.getList(this.getSpaceSubId(spaceId)).slice(0);
		if (!list.length) {
			return null;
		};

		list.sort((c1, c2) => U.Data.sortByNumericKey('createdAt', c1, c2, I.SortType.Desc));
		return list[0];
	};

	/**
	 * Gets the mention and message counters for a chat in a space.
	 * @param {string} spaceId - The space ID.
	 * @param {string} chatId - The chat ID.
	 * @returns {Counter} The counters for the chat.
	 */
	getChatCounters (spaceId: string, chatId: string): I.ChatCounter {
		const ret = { mentionCounter: 0, messageCounter: 0, reactionCounter: 0 };

		if (!spaceId || !chatId) {
			return ret;
		};

		// Discussions: read counters from the parent object's relations. The chatPreview
		// state subscription does not cover discussions, so stateMap can be missing or
		// stale here even when chatGlobal has the discussion's chat object.
		const parentId = this.discussionParentMap.get(spaceId)?.get(chatId);
		if (parentId) {
			const parent = this.getDiscussionParentDetail(spaceId, parentId, [ 'unreadMessageCount', 'unreadMentionCount', 'isArchived' ]);
			if (parent._empty_ || parent.isArchived) {
				return ret;
			};
			ret.messageCounter = Number(parent.unreadMessageCount) || 0;
			ret.mentionCounter = Number(parent.unreadMentionCount) || 0;
			return ret;
		};

		const chat = S.Detail.get(J.Constant.subId.chatGlobal, chatId, []);
		if (chat._empty_ || chat.isArchived) {
			return ret;
		};

		const state = this.stateMap.get(spaceId)?.get(chatId);
		if (state) {
			ret.mentionCounter = Number(state.mentionCounter) || 0;
			ret.messageCounter = Number(state.messageCounter) || 0;
			ret.reactionCounter = Number(state.reactionCounter) || 0;
		};
		return ret;
	};

	/**
	 * Reads a discussion parent's detail from the per-space discussion subscription
	 * if present, otherwise from the cross-space discussionGlobal subscription.
	 */
	getDiscussionParentDetail (spaceId: string, parentId: string, keys: string[]): any {
		const local = S.Detail.get(U.Subscription.spaceSubId(J.Constant.subId.discussion, spaceId), parentId, keys);
		if (!local._empty_) {
			return local;
		};
		return S.Detail.get(J.Constant.subId.discussionGlobal, parentId, keys);
	};

	/**
	 * Add or update a discussion → parent-object mapping.
	 */
	discussionParentMapSet (spaceId: string, parentObjectId: string, discussionId: string) {
		if (!spaceId || !discussionId || !parentObjectId) {
			return;
		};

		let inner = this.discussionParentMap.get(spaceId);
		if (!inner) {
			inner = observable.map(new Map());
			this.discussionParentMap.set(spaceId, inner);
		};
		inner.set(discussionId, parentObjectId);
	};

	/**
	 * Remove a discussion → parent-object mapping.
	 */
	discussionParentMapDelete (spaceId: string, discussionId: string) {
		this.discussionParentMap.get(spaceId)?.delete(discussionId);
	};

	/**
	 * Returns the parent object id for a discussion, or '' if not mapped.
	 */
	getDiscussionParentId (spaceId: string, discussionId: string): string {
		return this.discussionParentMap.get(spaceId)?.get(discussionId) || '';
	};

	/**
	 * Returns true if the stateMap entry should be excluded from aggregates because
	 * its chat (or discussion parent) is archived.
	 */
	isStateEntryArchived (spaceId: string, chatId: string): boolean {
		const parentId = this.discussionParentMap.get(spaceId)?.get(chatId);
		if (parentId) {
			const parent = this.getDiscussionParentDetail(spaceId, parentId, [ 'isArchived' ]);
			if (parent._empty_) {
				return true;
			};
			return !!parent.isArchived;
		};

		const chat = S.Detail.get(J.Constant.subId.chatGlobal, chatId, []);
		if (chat._empty_) {
			return true;
		};
		return !!chat.isArchived;
	};

	/**
	 * Sets the badge count in the UI based on message counters.
	 */
	setBadge () {
		const counters = this.getTotalCounters();
		const t = counters.mentionCounter ? '@' : this.counterString(counters.messageCounter);

		if (t != this.badgeValue) {
			this.badgeValue = t;
			Renderer.send('setBadge', t);
		};
	};

	/**
	 * Checks if message has a mantion of given participant ID
	 * @param {I.ChatMessage} message - The space ID.
	 * @param {string} participantId - The participant ID.
	 */
	isMention (message: I.ChatMessage, participantId: string): boolean {
		return !!message.content.marks.find(it => (it.type == I.MarkType.Mention) && (it.param == participantId));
	};

	/**
	 * Converts a counter value to a string for display.
	 * @param {number} c - The counter value.
	 * @returns {string} The formatted counter string.
	 */
	counterString (c: number): string {
		return String((c > 999 ? '999+' : c) || '');
	};

	/**
	 * Sets the attachments list.
	 */
	setAttachments (id: string, list: any[]) {
		this.attachmentsMap.set(id, list || []);
	};

	/**
	 * Gets the attachments list.
	 */
	getAttachments (id: string): any[] {
		return this.attachmentsMap.get(id) || [];
	};

	/**
	 * Gets a simple text representation of a message.
	 * @param {string} spaceId - The space ID.
	 * @param {I.ChatMessage} message - The chat message.
	 * @returns {string} The simple text representation.
	 */
	getMessageSimpleText (spaceId: string, message: I.ChatMessage, withAuthor: boolean): string {
		if (!message) {
			return '';
		};

		const { creator, content, attachments, dependencies } = message;
		const { text, marks } = content || {};

		if (!text && !attachments.length) {
			return '';
		};

		const ret = [];
		const participantId = U.Space.getParticipantId(spaceId, creator);

		if (withAuthor) {
			const author = dependencies.get(participantId);
			if (author) {
				ret.push(`${U.Object.name(author)}:`);
			};
		};

		if (text) {
			let t = U.String.sanitize(Mark.insertEmoji(text, marks));
			t = t.replace(/\n\r?/g, ' ');

			ret.push(t);
		};

		if (attachments.length) {
			const names = attachments.map(item => {
				const object = dependencies.get(item.target);
				return object ? U.Object.name(object) : '';
			}).filter(it => it).join(', ');

			ret.push(names);
		};

		return ret.join(' ');
	};

	/**
	 * Mutates subscriptionIds array and adds chat preview and vault subscription ids properly.
	 * @param {string} spaceId - The space ID.
	 * @param {string} subId - The subscription ID.
	 * @returns {string} The vault subscription ID.
	 */
	checkVaultSubscriptionIds (subIds: string[], spaceId: string, chatId: string): string[] {
		const ret = [];

		for (let i = 0; i < subIds.length; i++) {
			const subId = subIds[i];

			if (subId == J.Constant.subId.chatSpace) {
				const isArchived = U.Data.checkIsArchived(chatId);
				const isDeleted = U.Data.checkIsDeleted(chatId);

				ret.push(this.getSpaceSubId(spaceId));

				if (!isArchived && !isDeleted) {
					ret.push(this.getChatSubId(J.Constant.subId.chatPreview, spaceId, chatId));
				};
			} else {
				ret.push(subId);
			};
		};

		return ret;
	};

};

export const Chat: ChatStore = new ChatStore();
