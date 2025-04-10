import { observable, action, makeObservable, set, intercept } from 'mobx';
import { I, U, M } from 'Lib';

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

	setReadStatus (subId: string, ids: string[], isRead: boolean) {
		(ids || []).forEach(id => this.update(subId, { id, isRead }));
	};

	getUnreadCounter (subId) {
		const unread = this.getList(subId).filter(it => !it.isRead);

		return unread.length;
	};

	private createState (state: any) {
		const { messages, lastStateId } = state;
		const el = {
			messageOrderId: messages.orderId,
			messageCounter: messages.counter,
			lastStateId,
		};

		makeObservable(el, {
			messageOrderId: observable,
			messageCounter: observable,
			lastStateId: observable,
		});

		intercept(el as any, (change: any) => {
			return (change.newValue === el[change.name] ? null : change);
		});
		return el;
	};

	setState (subId: string, state: any) {
		const map = this.stateMap.get(subId);

		if (map) {
			set(map, state);
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

};

export const Chat: ChatStore = new ChatStore();
