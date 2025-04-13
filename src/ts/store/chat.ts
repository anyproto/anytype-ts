import { observable, action, makeObservable, set, intercept } from 'mobx';
import { J, I, U, M, Renderer } from 'Lib';

class ChatStore {

	public messageMap: Map<string, any[]> = observable(new Map());
	public replyMap: Map<string, Map<string, I.ChatMessage>> = observable(new Map());
	public stateMap: Map<string, any> = new Map();

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

	getUnreadCounter (subId) {
		const unread = this.getList(subId).filter(it => !it.isRead);

		return unread.length;
	};

	private createState (state: I.ChatState) {
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

	setState (subId: string, state: I.ChatState) {
		const map = this.stateMap.get(subId);

		if (map) {
			const { messages, mentions, lastStateId } = state;

			set(map, {
				messageOrderId: messages.orderId,
				messageCounter: messages.counter,
				mentionOrderId: mentions.orderId,
				mentionCounter: mentions.counter,
				lastStateId,
			});
		} else {
			this.stateMap.set(subId, this.createState(state));
		};
	};

	getState (subId: string) {
		return this.stateMap.get(subId) || {};
	};

	clear (subId: string) {
		this.messageMap.delete(subId);
		this.replyMap.delete(subId);
	};

	clearAll () {
		this.messageMap.clear();
		this.replyMap.clear();
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

	getTotalCounters (): { mentionCounter: number; messageCounter: number; } {
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

	getSpaceCounters (spaceId: string): any {
		if (!spaceId) {
			return null;
		};

		for (const [ key, value ] of this.stateMap.entries()) {
			if (key.startsWith([ J.Constant.subId.chatPreview, spaceId ].join('-'))) {
				return value;
			};
		};

		return null;
	};

	setBadge (counters: { mentionCounter: number; messageCounter: number; }) {
		let t = '';

		if (counters) {
			if (counters.mentionCounter) {
				t = '@';
			} else 
			if (counters.messageCounter) {
				t = String(counters.messageCounter || '');
			};
		};

		Renderer.send('setBadge', t || '');
	};

};

export const Chat: ChatStore = new ChatStore();
