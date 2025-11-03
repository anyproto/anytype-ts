import { action, computed, makeObservable, observable } from 'mobx';
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

	dataSet (data: I.MembershipData | null) {
		this.dataValue = data ? new M.MembershipData(data) : null;
	};

	/**
	 * Gets a membership product by ID.
	 * @param {string} id - The membership product ID.
	 * @returns {I.MembershipProduct | null} The membership product or null if not found.
	 */
	getProduct (id: string): I.MembershipProduct | null {
		return this.productsList.find(it => it.id === id) || null;
	};

	clearAll () {
		this.productsList = [];
		this.dataValue = null;
	};

};

export const Membership: MembershipStore = new MembershipStore();