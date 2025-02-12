import { observable, action, makeObservable, set, computed } from 'mobx';
import { I, S } from 'Lib';

class ProgressStore {

	public showValue = false;
    public listValue: I.Progress[] = [];

    constructor () {
        makeObservable(this, {
			listValue: observable,
			showValue: observable,
			list: computed,
			show: computed,
			add: action,
			update: action,
			delete: action,
			showSet: action,
        });
    };

	get show (): boolean {
		return this.showValue;
	};

	get list (): I.Progress[] {
		return this.listValue || [];
	};

	add (item: Partial<I.Progress>): void {
		this.listValue.unshift(item);
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

	showSet (v: boolean): void {
		this.showValue = Boolean(v);
	};

	getList (filter?: (it: I.Progress) => boolean) {
		const { space } = S.Common;

		return this.list.filter(it => {
			let ret = true;

			if (filter) {
				ret = filter(it);
			};

			return ret && (!it.spaceId || (it.spaceId == space));
		});
	};

	getItem (id: string): I.Progress {
		return this.getList().find(it => it.id == id);
	};

	getPercent (list: I.Progress[]): number {
		const current = list.reduce((acc, it) => acc + (Number(it.current) || 0), 0);
		const total = list.reduce((acc, it) => acc + (Number(it.total) || 0), 0);

		return total > 0 ? Math.min(100, Math.ceil(current / total * 100)) : 0;
	};

};

export const Progress: ProgressStore = new ProgressStore();