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
		this.messageMap.set(rootId, observable(list));
	};

	map (list: string[]) {
		return (list || []).map(it => {
			let ret: any = { text: '', data: {} };
			try { 
				ret = JSON.parse(it);
				ret.data = JSON.parse(ret.text);

				delete(ret.text);
			} catch (e) { /**/ };

			return new M.ChatMessage(ret);
		});
	};

	add (rootId: string, item: I.ChatMessage): void {
		const list = this.getList(rootId);

		item.data = this.getData(item);

		list.push(new M.ChatMessage(item));
		this.set(rootId, list);
	};

	update (rootId: string, param: Partial<I.ChatMessage>): void {
		const list = this.getList(rootId);
		const item = list.find(it => it.id == param.id);

		item.data = this.getData(item);

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

	getData (item: I.ChatMessage) {
		let data = {};
		try { 
			data = JSON.parse(item.text);
			delete(item.text);
		} catch (e) { /**/ };
		return data;
	};

	getList (rootId: string): I.ChatMessage[] {
		return this.messageMap.get(rootId) || [];
	};

	getMessage (rootId: string, id: string): I.ChatMessage {
		return this.getList(rootId).find(it => it.id == id);
	};

};

export const Chat: ChatStore = new ChatStore();