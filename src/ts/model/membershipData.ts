import { observable, makeObservable } from 'mobx';
import * as I from 'Interface';
import MembershipProduct from './membershipProduct';

class MembershipPurchasedProduct implements I.MembershipPurchasedProduct {

	product: I.MembershipProduct | null = null;
	info = {
		dateStarted: 0,
		dateEnds: 0,
		isAutoRenew: false,
		period: 0,
	};
	status: I.MembershipStatus = I.MembershipStatus.None;

	constructor (props: I.MembershipPurchasedProduct) {

		// Keep the whole embedded product: status alone can then render the purchased plan,
		// including hidden products and products missing from the catalog
		this.product = props.product?.id ? new MembershipProduct(props.product) : null;
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

		return this;
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

	/**
	 * The paid period has ended (products without an end date never elapse).
	 */
	get isElapsed (): boolean {
		return (this.info.dateEnds > 0) && (this.info.dateEnds * 1000 <= Date.now());
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

		return this;
	};

	/**
	 * Resolves a purchased product against the full catalog (hidden products included), falling
	 * back to the product embedded in the status.
	 */
	resolveProduct (item: I.MembershipPurchasedProduct): I.MembershipProduct | null {
		const id = item?.product?.id;
		if (!id) {
			return null;
		};

		return S.Membership.getProduct(id) || item.product || null;
	};

	getTopProduct (): I.MembershipProduct | null {
		const list = this.products.map(it => this.resolveProduct(it)).filter(it => it && it.isTopLevel);
		return list.length ? list[0] : null;
	};

	getTopPurchasedProduct (): I.MembershipPurchasedProduct | null {
		const list = this.products.filter(it => this.resolveProduct(it)?.isTopLevel);
		return list.length ? list[0] : null;
	};

	/**
	 * Purchased entries whose product can not be resolved at all. Screens show a fallback for
	 * them, never "no membership".
	 */
	getUnresolvedProducts (): I.MembershipPurchasedProduct[] {
		return this.products.filter(it => !this.resolveProduct(it));
	};

};

export default MembershipData;
