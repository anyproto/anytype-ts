import { action, computed, makeObservable, observable, set } from 'mobx';
import { I, M } from 'Lib';

class MembershipStore {

	public productsList: I.MembershipProduct[] = [];
	public dataValue: I.MembershipData = null;

	constructor () {
		makeObservable(this, {
			productsList: observable,
			dataValue: observable,
			products: computed,
			data: computed,
			productsSet: action,
			dataSet: action,
		});
	};

	get products (): I.MembershipProduct[] {
		return this.productsList || [];
	};

	get data (): I.MembershipData | null {
		return this.dataValue;
	};

	/**
	 * Sets the membership products list.
	 * @param {I.MembershipProduct[]} list - The membership products list.
	 */
	productsSet (list: I.MembershipProduct[]) {
		this.productsList = (list || []).map(it => new M.MembershipProduct(it));
	};

	/**
	 * Updates the membership products list.
	 * @param {I.MembershipProduct[]} list - The membership products list.
	 */
	productsUpdate (list: I.MembershipProduct[]) {
		list.forEach((it: any) => {
			const idx = this.productsList.findIndex(p => p.id == it.id);
			if (idx >= 0) {
				set(this.productsList[idx], it);
			} else {
				this.productsList.push(new M.MembershipProduct(it));
			};
		});
	};

	/**
	 * Sets the membership data.
	 * @param {I.MembershipData | null} data - The membership data.
	 */
	dataSet (data: I.MembershipData | null) {
		this.dataValue = data ? new M.MembershipData(data) : null;
	};

	/**
	 * Updates the membership data.
	 * @param {Partial<I.MembershipData>} data - The partial membership data to update.
	 */
	dataUpdate (data: Partial<I.MembershipData>) {
		if (this.dataValue) {
			const model = new M.MembershipData(Object.assign(this.dataValue, data));

			set(this.dataValue, model);
		} else 
		if (data) {
			this.dataValue = new M.MembershipData(data as I.MembershipData);
		};
	};

	/**
	 * Gets a membership product by ID.
	 * @param {string} id - The membership product ID.
	 * @returns {I.MembershipProduct | null} The membership product or null if not found.
	 */
	getProduct (id: string): I.MembershipProduct | null {
		return this.productsList.find(it => it.id == id) || null;
	};

	clearAll () {
		this.productsList = [];
		this.dataValue = null;
	};

};

export const Membership: MembershipStore = new MembershipStore();