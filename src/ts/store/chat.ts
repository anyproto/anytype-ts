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

	set (rootId: string, list: I.ChatMessage[]): void {
		list = list.map(it => new M.ChatMessage(it));
		list = U.Common.arrayUniqueObjects(list, 'id');
		this.messageMap.set(rootId, observable.array(list));
	};

	prepend (rootId: string, add: I.ChatMessage[]): void {
		add = add.map(it => new M.ChatMessage(it));

		let list = this.getList(rootId);
		list.unshift(...add);
		list = U.Common.arrayUniqueObjects(list, 'id');
		this.set(rootId, list);
	};

	append (rootId: string, add: I.ChatMessage[]): void {
		add = add.map(it => new M.ChatMessage(it));

		let list = this.getList(rootId);
		list.push(...add);
		list = U.Common.arrayUniqueObjects(list, 'id');
		this.set(rootId, list);
	};

	add (rootId: string, idx: number, param: I.ChatMessage): void {
		const list = this.getList(rootId);
		const item = this.getMessage(rootId, param.id);
		
		if (item) {
			return;
		};

		list.splice(idx, 0, param);
		this.set(rootId, list);
	};

	update (rootId: string, param: Partial<I.ChatMessage>): void {
		const item = this.getMessage(rootId, param.id);

		if (item) {
			set(item, param);
		};
	};

	delete (rootId: string, id: string) {
		this.set(rootId, this.getList(rootId).filter(it => it.id != id));
	};

	setReply (rootId: string, message: I.ChatMessage) {
		const map = this.replyMap.get(rootId) || new Map();

		map.set(message.id, message);

		this.replyMap.set(rootId, map);
	};

	setReadStatus (rootId: string, ids: string[], isRead: boolean) {
		(ids || []).forEach(id => this.update(rootId, { id, isRead }));
	};

	private createState (state: any) {
		const { messages, dbTimestamp } = state;
		const el = {
			messageOrderId: messages.orderId,
			messageCounter: messages.counter,
			dbTimestamp,
		};

		makeObservable(el, {
			messageOrderId: observable,
			messageCounter: observable
		});
		intercept(el as any, (change: any) => {
			return (change.newValue === el[change.name] ? null : change);
		});
		return el;
	};

	setState (rootId: string, state: any) {
		const map = this.stateMap.get(rootId);

		if (map) {
			set(map, state);
		} else {
			this.stateMap.set(rootId, this.createState(state));
		};
	};

	getState (rootId: string) {
		return this.stateMap.get(rootId) || {};
	};

	clear (rootId: string) {
		this.messageMap.delete(rootId);
		this.replyMap.delete(rootId);
	};

	clearAll () {
		this.messageMap.clear();
		this.replyMap.clear();
	};

	getList (rootId: string): any[] {
		return this.messageMap.get(rootId) || [];
	};

	getMessage (rootId: string, id: string): I.ChatMessage {
		return this.getList(rootId).find(it => it.id == id);
	};

	getReply (rootId: string, id: string): I.ChatMessage {
		return this.replyMap.get(rootId)?.get(id);
	};

};

export const Chat: ChatStore = new ChatStore();
