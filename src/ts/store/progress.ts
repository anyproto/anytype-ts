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

	getList () {
		const { space } = S.Common;
		const skip = [ I.ProgressState.Done, I.ProgressState.Canceled ];

		return this.list.filter(it => (!it.spaceId || (it.spaceId == space)) && !skip.includes(it.state));
	};

	getItem (id: string): I.Progress {
		return this.getList().find(it => it.id == id);
	};

	getField (field: string): number {
		return this.getList().reduce((acc, it) => acc + (Number(it[field]) || 0), 0);
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

		return total > 0 ? Math.min(100, Math.ceil(current / total * 100)) : 0;
	};

};

export const Progress: ProgressStore = new ProgressStore();