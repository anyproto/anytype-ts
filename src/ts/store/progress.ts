import { observable, action, makeObservable, set, computed } from 'mobx';
import * as I from 'Interface';

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
		return this.listValue || [];
	};

	/**
	 * Adds a progress item to the list.
	 * @param {Partial<I.Progress>} item - The progress item to add.
	 */
	add (item: Partial<I.Progress>): void {
		this.listValue.unshift(item);
	};

	/**
	 * Updates a progress item in the list.
	 * @param {Partial<I.Progress>} param - The progress item to update.
	 */
	update (param: Partial<I.Progress>): void {
		const item = this.getItem(param.id);

		if (item) {
			set(item, param);
		} else {
			this.add(param);
		};
	};

	/**
	 * Deletes a progress item by ID.
	 * @param {string} id - The progress item ID.
	 */
	delete (id: string) {
		this.listValue = this.listValue.filter(it => it.id != id);
	};

	/**
	 * Gets the list of progress items, optionally filtered and by space.
	 * @private
	 * @param {(it: I.Progress) => boolean} [filter] - Optional filter function.
	 * @returns {I.Progress[]} The filtered progress items.
	 */
	getList (filter?: (it: I.Progress) => boolean): I.Progress[] {
		const { space } = S.Common;

		return this.list.filter(it => {
			let ret = true;

			if (filter) {
				ret = filter(it);
			};

			return ret && (!it.spaceId || (it.spaceId == space));
		});
	};

	/**
	 * Gets a progress item by ID.
	 * @private
	 * @param {string} id - The progress item ID.
	 * @returns {I.Progress} The progress item.
	 */
	getItem (id: string): I.Progress {
		return this.getList().find(it => it.id == id);
	};

	/**
	 * Gets the percent complete for a list of progress items.
	 * @private
	 * @param {I.Progress[]} list - The list of progress items.
	 * @returns {number} The percent complete.
	 */
	getPercent (list: I.Progress[]): number {
		const current = list.reduce((acc, it) => acc + (Number(it.current) || 0), 0);
		const total = list.reduce((acc, it) => acc + (Number(it.total) || 0), 0);

		return total > 0 ? Math.min(100, Math.ceil(current / total * 100)) : 0;
	};

};

export const Progress: ProgressStore = new ProgressStore();
