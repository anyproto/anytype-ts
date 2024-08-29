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
		this.messageMap.set(rootId, observable.array(list));
	};

	prepend (rootId: string, add: I.ChatMessage[]): void {
		add = add.map(it => new M.ChatMessage(it));

		let list = this.getList(rootId);
		list = add.concat(list);
		this.set(rootId, observable.array(list));
	};

	add (rootId: string, idx: number, item: I.ChatMessage): void {
		const list = this.getList(rootId);

		list.splice(idx, 0, item);
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

		console.log('delete', rootId, id, list);

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