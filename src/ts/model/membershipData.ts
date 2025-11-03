import { I, U } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class MembershipPurchasedProduct implements I.MembershipPurchasedProduct {

	product: I.MembershipProduct = null;
	info = {
		dateStarted: 0,
		dateEnds: 0,
		isAutoRenew: false,
		isYearly: false,
	};
	status: I.MembershipStatus = I.MembershipStatus.None;

	constructor (props: I.MembershipPurchasedProduct) {

		this.product = props.product ? props.product : null;
		this.info = {
			dateStarted: Number(props.info?.dateStarted) || 0,
			dateEnds: Number(props.info?.dateEnds) || 0,
			isAutoRenew: Boolean(props.info?.isAutoRenew),
			isYearly: Boolean(props.info?.isYearly),
		};
		this.status = Number(props.status) || I.MembershipStatus.None;

		makeObservable(this, {
			product: observable,
			info: observable,
			status: observable,
		});

		intercept(this as any, change => U.Common.intercept(this, change));
	};

	get isNone (): boolean {
		return this.status === I.MembershipStatus.None;
	};

	get isActive (): boolean {
		return this.status === I.MembershipStatus.Active;
	};

	get isPending (): boolean {
		return this.status === I.MembershipStatus.Pending;
	};

	get isFinalization (): boolean {
		return this.status === I.MembershipStatus.Finalization;
	};

};

class MembershipData implements I.MembershipData {

	products: I.MembershipPurchasedProduct[] = [];
	nextInvoice = {
		date: 0,
		total: {
			currency: '',
			amountCents: 0,
		},
	};

	constructor (props: Partial<I.MembershipData>) {
		this.products = Array.isArray(props.products) ? props.products : [];
		this.products = this.products.map(it => new MembershipPurchasedProduct(it));

		this.nextInvoice = {
			date: Number(props.nextInvoice?.date) || 0,
			total: {
				currency: String(props.nextInvoice?.total?.currency || ''),
				amountCents: Number(props.nextInvoice?.total?.amountCents) || 0,
			},
		};

		makeObservable(this, {
			products: observable,
			nextInvoice: observable,
		});

		intercept(this as any, change => U.Common.intercept(this, change));
	};

	getTopProduct (): I.MembershipPurchasedProduct | null {
		return this.products.find(it => it.isActive && it.product.isTopLevel) || null;
	};

};

export default MembershipData;