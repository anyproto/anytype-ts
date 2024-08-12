import { observable, action, computed, makeObservable, set } from 'mobx';
import { I, M, Renderer } from 'Lib';

class ChatStore {

    public map: Map<string, any[]> = new Map();

    constructor () {
        makeObservable(this, {
			add: action,
			update: action,
			delete: action,
        });
    };

	set (rootId: string, list: I.ChatMessage[]): void {
		this.map.set(rootId, observable(list || []));
	};

	add (rootId: string, item: I.ChatMessage): void {
		const list = this.getList(rootId);

		list.push(item);
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
		this.map.delete(rootId);
	};

	clearAll () {
		this.map.clear();
	};

	getList (rootId: string): any[] {
		return this.map.get(rootId) || [];
	};

};

export const Chat: ChatStore = new ChatStore();