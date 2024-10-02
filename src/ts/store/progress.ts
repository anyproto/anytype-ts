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

	getField (field: string): number {
		return this.list.reduce((acc, it) => acc + it[field], 0);
	};

	getCurrent (): number {
		return this.getField('current');
	};

	getTotal (): number {
		return this.getField('total');
	};

	getPercent (): number {
		const current = this.getCurrent();
		const total = this.getTotal();

		return total > 0 ? Math.ceil(current / total * 100) : 0;
	};

};

export const Progress: ProgressStore = new ProgressStore();