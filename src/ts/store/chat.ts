import { observable, action, makeObservable, set } from 'mobx';
import { I, M } from 'Lib';

class ChatStore {

    public messageMap: Map<string, any[]> = new Map();

    constructor () {
        makeObservable(this, {
			add: action,
			update: action,
			delete: action,
        });
    };

	set (rootId: string, list: I.ChatMessage[]): void {
		list = list.map(it => new M.ChatMessage(it));
		this.messageMap.set(rootId, observable(list));
	};

	add (rootId: string, item: I.ChatMessage): void {
		const list = this.getList(rootId);

		list.push(new M.ChatMessage(item));
		this.set(rootId, list);
	};

	update (rootId: string, param: Partial<I.ChatMessage>): void {
		const list = this.getList(rootId);
		const item = list.find(it => it.id == param.id);

		if (item) {
			set(item, param);
		};
	};

	delete (rootId: string, id: string) {
		const list = this.getList(rootId).filter(it => it.id != id);

		this.set(rootId, list);
	};

	clear (rootId: string) {
		this.messageMap.delete(rootId);
	};

	clearAll () {
		this.messageMap.clear();
	};

	getList (rootId: string): I.ChatMessage[] {
		return this.messageMap.get(rootId) || [];
	};

	getMessage (rootId: string, id: string): I.ChatMessage {
		return this.getList(rootId).find(it => it.id == id);
	};

};

export const Chat: ChatStore = new ChatStore();