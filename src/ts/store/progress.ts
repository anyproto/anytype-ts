import { observable, action, makeObservable, set, computed } from 'mobx';
import { I } from 'Lib';

class ProgressStore {

    public listValue: I.Progress[] = [];

    constructor () {
        makeObservable(this, {
			listValue: observable,
			list: computed,
			add: action,
			update: action,
			delete: action,
        });
    };

	get list (): I.Progress[] {
		return this.listValue;
	};

	add (item: Partial<I.Progress>): void {
		this.list.unshift(item);
	};

	update (param: Partial<I.Progress>): void {
		const item = this.getItem(param.id);

		if (item) {
			set(item, param);
		} else {
			this.add(param);
		};
	};

	delete (id: string) {
		this.listValue = this.listValue.filter(it => it.id != id);
	};

	getItem (id: string): I.Progress {
		return this.listValue.find(it => it.id == id);
	};

};

export const Progress: ProgressStore = new ProgressStore();