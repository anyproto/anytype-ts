import { I, U, M, S } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class MembershipPurchasedProduct implements I.MembershipPurchasedProduct {

	product: { id: string; } = null;
	info = {
		dateStarted: 0,
		dateEnds: 0,
		isAutoRenew: false,
		period: 0,
	};
	status: I.MembershipStatus = I.MembershipStatus.None;

	constructor (props: I.MembershipPurchasedProduct) {

		this.product = props.product ? { id: props.product.id } : null;
		this.info = {
			dateStarted: Number(props.info?.dateStarted) || 0,
			dateEnds: Number(props.info?.dateEnds) || 0,
			isAutoRenew: Boolean(props.info?.isAutoRenew),
			period: Number(props.info?.period) || I.MembershipPeriod.Unlimited,
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
	teamOwnerId = '';
	paymentProvider: I.PaymentProvider = I.PaymentProvider.None;

	constructor (props: Partial<I.MembershipData>) {
		this.products = Array.isArray(props.products) ? props.products : [];
		this.products = this.products.map(it => new MembershipPurchasedProduct(it));
		this.teamOwnerId = String(props.teamOwnerId || '');
		this.paymentProvider = Number(props.paymentProvider) || I.PaymentProvider.None;

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
			teamOwnerId: observable,
			paymentProvider: observable,
		});

		intercept(this as any, change => U.Common.intercept(this, change));
	};

	getTopProduct (): I.MembershipProduct | null {
		const list = this.products.map(it => S.Membership.getProduct(it.product?.id)).filter(it => it && it.isTopLevel);
		return list.length ? list[0] : null;
	};

	getTopPurchasedProduct (): I.MembershipPurchasedProduct | null {
		const list = this.products.filter(it => S.Membership.getProduct(it.product?.id)?.isTopLevel);
		return list.length ? list[0] : null;
	};

};

export default MembershipData;
