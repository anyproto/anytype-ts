import { makeObservable, observable } from 'mobx';
import * as I from 'Interface';

const COLORS = [
	'green',
	'blue',
	'red',
	'ice',
];

class MembershipProduct implements I.MembershipProduct {

	id = '';
	name = '';
	description = '';
	isTopLevel = false;
	isIntro = false;
	isHidden = false;
	color = '';
	offer = '';
	pricesYearly: I.MembershipAmount[] = [];
	pricesMonthly: I.MembershipAmount[] = [];
	pricesLifetime: I.MembershipAmount[] = [];
	features = {
		storageBytes: 0,
		spaceReaders: 0,
		spaceWriters: 0,
		sharedSpaces: 0,
		privateSpaces: 0,
		teamSeats: 0,
		anyNameCount: 0,
		anyNameMinLen: 0,
	};

	constructor (props: Partial<I.MembershipProduct>) {
		this.id = String(props.id || '');
		this.name = String(props.name || '');
		this.description = String(props.description || '');
		this.isTopLevel = Boolean(props.isTopLevel);
		this.isIntro = Boolean(props.isIntro);
		this.isHidden = Boolean(props.isHidden);
		this.color = String(props.color || '');
		this.offer = String(props.offer || '');

		this.pricesYearly = Array.isArray(props.pricesYearly) ? props.pricesYearly.map(it => ({
			currency: String(it.currency || ''),
			amountCents: Number(it.amountCents) || 0,
		})) : [];

		this.pricesMonthly = Array.isArray(props.pricesMonthly) ? props.pricesMonthly.map(it => ({
			currency: String(it.currency || ''),
			amountCents: Number(it.amountCents) || 0,
		})) : [];

		this.pricesLifetime = Array.isArray(props.pricesLifetime) ? props.pricesLifetime.map(it => ({
			currency: String(it.currency || ''),
			amountCents: Number(it.amountCents) || 0,
		})) : [];

		this.features = {
			storageBytes: Number(props.features?.storageBytes) || 0,
			spaceReaders: Number(props.features?.spaceReaders) || 0,
			spaceWriters: Number(props.features?.spaceWriters) || 0,
			sharedSpaces: Number(props.features?.sharedSpaces) || 0,
			privateSpaces: Number(props.features?.privateSpaces) || 0,
			teamSeats: Number(props.features?.teamSeats) || 0,
			anyNameCount: Number(props.features?.anyNameCount) || 0,
			anyNameMinLen: Number(props.features?.anyNameMinLen) || 0,
		};

		makeObservable(this, {
			name: observable,
			description: observable,
			isTopLevel: observable,
			isIntro: observable,
			isHidden: observable,
			color: observable,
			offer: observable,
			pricesYearly: observable,
			pricesMonthly: observable,
			pricesLifetime: observable,
			features: observable,
		});

		return this;
	};

	get featuresList (): { key: string; value: number; }[] {
		const skip = [ 'spaceReaders', 'spaceWriters', 'anyNameCount' ];

		return Object.entries(this.features).
			map(([key, value]) => ({ key, value })).
			filter(it => !skip.includes(it.key) && it.value);
	};

	get colorStr (): string {
		return COLORS.includes(this.color) ? this.color : 'default';
	};

	get iconName (): string {
		return `tier/${this.colorStr == 'default' ? 'purple' : this.colorStr}`;
	};

	getPrice (period: I.MembershipPeriod): I.MembershipAmount | null {
		let prices: I.MembershipAmount[] = [];

		switch (period) {
			case I.MembershipPeriod.Monthly: prices = this.pricesMonthly; break;
			case I.MembershipPeriod.Yearly: prices = this.pricesYearly; break;
			case I.MembershipPeriod.Lifetime: prices = this.pricesLifetime; break;
		};

		return prices.length ? prices[0] : null;
	};

	getPriceString (period: I.MembershipPeriod): string {
		return U.Common.getMembershipPriceString(this.getPrice(period));
	};

};

export default MembershipProduct;
