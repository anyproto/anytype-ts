import { observable, action, makeObservable, set, intercept } from 'mobx';
import { J, I, U, M, S, Renderer } from 'Lib';

interface Counter {
	mentionCounter: number; 
	messageCounter: number;
};

interface ChatState {
	messageOrderId: string;
	messageCounter: number;
	mentionOrderId: string;
	mentionCounter: number;
	lastStateId: string;
};

class ChatStore {

	public messageMap: Map<string, any[]> = observable(new Map());
	public replyMap: Map<string, Map<string, I.ChatMessage>> = observable(new Map());
	public stateMap: Map<string, Map<string, ChatState>> = observable.map(new Map());

	constructor () {
		makeObservable(this, {
			add: action,
			update: action,
			delete: action,
			setReply: action,
			setState: action,
		});
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
	};

	/**
	 * Prepends chat messages to the list for a subId.
	 * @param {string} subId - The subscription ID.
	 * @param {I.ChatMessage[]} add - The chat messages to prepend.
	 */
	prepend (subId: string, add: I.ChatMessage[]): void {
		add = add.map(it => new M.ChatMessage(it));

		let list = this.getList(subId);
		list.unshift(...add);
		list = U.Common.arrayUniqueObjects(list, 'id');
		this.set(subId, list);
	};

	/**
	 * Appends chat messages to the list for a subId.
	 * @param {string} subId - The subscription ID.
	 * @param {I.ChatMessage[]} add - The chat messages to append.
	 */
	append (subId: string, add: I.ChatMessage[]): void {
		add = add.map(it => new M.ChatMessage(it));

		let list = this.getList(subId);
		list.push(...add);
		list = U.Common.arrayUniqueObjects(list, 'id');
		this.set(subId, list);
	};

	/**
	 * Adds a chat message at a specific index.
	 * @param {string} subId - The subscription ID.
	 * @param {number} idx - The index to insert at.
	 * @param {I.ChatMessage} param - The chat message to add.
	 */
	add (subId: string, idx: number, param: I.ChatMessage): void {
		const list = this.getList(subId);
		const item = this.getMessage(subId, param.id);
		
		if (item) {
			return;
		};

		list.splice(idx, 0, param);
		this.set(subId, list);
	};

	/**
	 * Updates a chat message by ID.
	 * @param {string} subId - The subscription ID.
	 * @param {Partial<I.ChatMessage>} param - The chat message update.
	 */
	update (subId: string, param: Partial<I.ChatMessage>): void {
		const item = this.getMessage(subId, param.id);

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
	 * Creates a chat state object with observables and intercepts.
	 * @private
	 * @param {I.ChatState} state - The chat state input.
	 * @returns {ChatState} The created chat state object.
	 */
	private createState (state: I.ChatState): ChatState {
		const { messages, mentions, lastStateId } = state;
		const el = {
			messageOrderId: messages.orderId,
			messageCounter: messages.counter,
			mentionOrderId: mentions.orderId,
			mentionCounter: mentions.counter,
			lastStateId,
		};

		makeObservable(el, {
			messageOrderId: observable,
			messageCounter: observable,
			mentionOrderId: observable,
			mentionCounter: observable,
			lastStateId: observable,
		});

		intercept(el as any, (change: any) => {
			return (change.newValue === el[change.name] ? null : change);
		});
		return el;
	};

	/**
	 * Parses a subId into its components.
	 * @private
	 * @param {string} subId - The subscription ID.
	 * @returns {{ prefix: string; spaceId: string; chatId: string; isSpace: boolean; }} The parsed parameters.
	 */
	private getSubParam (subId: string): { prefix: string; spaceId: string; chatId: string; isSpace: boolean; } {
		const [ prefix, spaceId, chatId ] = subId.split('-');

		if (prefix == J.Constant.subId.chatSpace) {
			return { prefix, spaceId, chatId, isSpace: true };
		} else {
			return { prefix: '', spaceId: S.Common.space, chatId: prefix, isSpace: false };
		};
	};

	/**
	 * Gets the subscription ID for a space and chat.
	 * @param {string} spaceId - The space ID.
	 * @param {string} chatId - The chat ID.
	 * @returns {string} The subscription ID.
	 */
	getSubId (spaceId: string, chatId: string): string {
		return [ J.Constant.subId.chatSpace, spaceId, chatId ].join('-');
	};

	/**
	 * Sets the chat state for a subId.
	 * @param {string} subId - The subscription ID.
	 * @param {I.ChatState} state - The chat state.
	 */
	setState (subId: string, state: I.ChatState) {
		const param = this.getSubParam(subId);
	
		let spaceMap = this.stateMap.get(param.spaceId);
		if (!spaceMap) {
			spaceMap = new Map();
		};

		const current = spaceMap.get(param.chatId);
		if (current) {
			const { messages, mentions, lastStateId } = state;

			set(current, {
				messageOrderId: messages.orderId,
				messageCounter: messages.counter,
				mentionOrderId: mentions.orderId,
				mentionCounter: mentions.counter,
				lastStateId,
			});
		} else {
			spaceMap.set(param.chatId, this.createState(state));
		};

		this.stateMap.set(param.spaceId, spaceMap);
	};

	/**
	 * Gets the chat state for a subId.
	 * @param {string} subId - The subscription ID.
	 * @returns {ChatState} The chat state.
	 */
	getState (subId: string): ChatState {
		const param = this.getSubParam(subId);
		const ret = {
			messageOrderId: '',
			messageCounter: 0,
			mentionOrderId: '',
			mentionCounter: 0,
			lastStateId: '',
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
	};

	/**
	 * Clears all chat data in the store.
	 */
	clearAll () {
		this.messageMap.clear();
		this.replyMap.clear();
		this.stateMap.clear();
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
	getMessage (subId: string, id: string): I.ChatMessage {
		return this.getList(subId).find(it => it.id == id);
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
	getTotalCounters (): Counter {
		const spaces = U.Space.getList();
		const ret = { mentionCounter: 0, messageCounter: 0 };

		if (!spaces.length) {
			return ret;
		};

		for (const space of spaces) {
			const counters = this.getSpaceCounters(space.targetSpaceId);

			if (counters) {
				ret.mentionCounter += counters.mentionCounter || 0;
				ret.messageCounter += counters.messageCounter || 0;
			};
		};

		return ret;
	};

	/**
	 * Gets the mention and message counters for a space.
	 * @param {string} spaceId - The space ID.
	 * @returns {Counter} The counters for the space.
	 */
	getSpaceCounters (spaceId: string): Counter {
		const spaceMap = this.stateMap.get(spaceId);
		const ret = { mentionCounter: 0, messageCounter: 0 };

		if (spaceMap) {
			for (const [ chatId, state ] of spaceMap) {
				ret.mentionCounter += Number(state.mentionCounter) || 0;
				ret.messageCounter += Number(state.messageCounter) || 0;
			};
		};

		return ret;
	};

	/**
	 * Gets the mention and message counters for a chat in a space.
	 * @param {string} spaceId - The space ID.
	 * @param {string} chatId - The chat ID.
	 * @returns {Counter} The counters for the chat.
	 */
	getChatCounters (spaceId: string, chatId: string): Counter {
		const spaceMap = this.stateMap.get(spaceId);
		const ret = { mentionCounter: 0, messageCounter: 0 };

		if (spaceMap) {
			const state = spaceMap.get(chatId);
			if (state) {
				ret.mentionCounter = Number(state.mentionCounter) || 0;
				ret.messageCounter = Number(state.messageCounter) || 0;
			};
		};

		return ret;
	};

	/**
	 * Sets the badge count in the UI based on message counters.
	 */
	setBadge () {
		const { config } = S.Common;

		let t = 0;

		if (config.experimental) {
			const counters = this.getTotalCounters();
			if (counters) {
				t = counters.messageCounter;
			};
		};

		Renderer.send('setBadge', String(t || ''));
	};

	/**
	 * Checks if message has a mantion of given participant ID
	 * @param {I.ChatMessage} message - The space ID.
	 * @param {string} participantId - The participant ID.
	 */
	isMention (message: I.ChatMessage, participantId: string): boolean {
		return !!message.content.marks.find(it => (it.type == I.MarkType.Mention) && (it.param == participantId));
	};

};

export const Chat: ChatStore = new ChatStore();
