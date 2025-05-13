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

	set (subId: string, list: I.ChatMessage[]): void {
		list = list.map(it => new M.ChatMessage(it));
		list = U.Common.arrayUniqueObjects(list, 'id');

		this.messageMap.set(subId, observable.array(list));
	};

	prepend (subId: string, add: I.ChatMessage[]): void {
		add = add.map(it => new M.ChatMessage(it));

		let list = this.getList(subId);
		list.unshift(...add);
		list = U.Common.arrayUniqueObjects(list, 'id');
		this.set(subId, list);
	};

	append (subId: string, add: I.ChatMessage[]): void {
		add = add.map(it => new M.ChatMessage(it));

		let list = this.getList(subId);
		list.push(...add);
		list = U.Common.arrayUniqueObjects(list, 'id');
		this.set(subId, list);
	};

	add (subId: string, idx: number, param: I.ChatMessage): void {
		const list = this.getList(subId);
		const item = this.getMessage(subId, param.id);
		
		if (item) {
			return;
		};

		list.splice(idx, 0, param);
		this.set(subId, list);
	};

	update (subId: string, param: Partial<I.ChatMessage>): void {
		const item = this.getMessage(subId, param.id);

		if (item) {
			set(item, param);
		};
	};

	delete (subId: string, id: string) {
		this.set(subId, this.getList(subId).filter(it => it.id != id));
	};

	setReply (subId: string, message: I.ChatMessage) {
		const map = this.replyMap.get(subId) || new Map();

		map.set(message.id, message);

		this.replyMap.set(subId, map);
	};

	setReadMessageStatus (subId: string, ids: string[], value: boolean) {
		(ids || []).forEach(id => this.update(subId, { id, isReadMessage: value }));
	};

	setReadMentionStatus (subId: string, ids: string[], value: boolean) {
		(ids || []).forEach(id => this.update(subId, { id, isReadMention: value }));
	};

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

	private getSubParam (subId: string): { prefix: string; spaceId: string; chatId: string; isSpace: boolean; } {
		const [ prefix, spaceId, chatId ] = subId.split('-');

		if (prefix == J.Constant.subId.chatSpace) {
			return { prefix, spaceId, chatId, isSpace: true };
		} else {
			return { prefix: '', spaceId: S.Common.space, chatId: prefix, isSpace: false };
		};
	};

	getSubId (spaceId: string, chatId: string): string {
		return [ J.Constant.subId.chatSpace, spaceId, chatId ].join('-');
	};

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

	clear (subId: string) {
		const param = this.getSubParam(subId);

		this.messageMap.delete(subId);
		this.replyMap.delete(subId);
		this.stateMap.get(param.spaceId)?.delete(param.chatId);
	};

	clearAll () {
		this.messageMap.clear();
		this.replyMap.clear();
		this.stateMap.clear();
	};

	getList (subId: string): any[] {
		return this.messageMap.get(subId) || [];
	};

	getMessage (subId: string, id: string): I.ChatMessage {
		return this.getList(subId).find(it => it.id == id);
	};

	getReply (subId: string, id: string): I.ChatMessage {
		return this.replyMap.get(subId)?.get(id);
	};

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

	setBadge () {
		const { config } = S.Common;

		let t = 0;

		if (config.experimental) {
			const counters = this.getTotalCounters();
			if (counters) {
				t = counters.mentionCounter + counters.messageCounter;
			};
		};

		Renderer.send('setBadge', String(t || ''));
	};

};

export const Chat: ChatStore = new ChatStore();
