import { I, U } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class Membership implements I.Membership {

	tier: I.TierType = I.TierType.None;
	status: I.MembershipStatus = I.MembershipStatus.Unknown;
	dateStarted = 0;
	dateEnds = 0;
	isAutoRenew = false;
	nextTier: I.TierType = I.TierType.None;
	nextTierEnds = 0;
	paymentMethod: I.PaymentMethod = I.PaymentMethod.None;
	name = '';
	nameType: I.NameType = I.NameType.Any;
	userEmail = '';
	subscribeToNewsletter = false;

	constructor (props: I.Membership) {
		this.tier = Number(props.tier) || I.TierType.None;
		this.status = Number(props.status) || I.MembershipStatus.Unknown;
		this.dateStarted = Number(props.dateStarted) || 0;
		this.dateEnds = Number(props.dateEnds) || 0;
		this.isAutoRenew = Boolean(props.isAutoRenew);
		this.nextTier = Number(props.nextTier) || I.TierType.None;
		this.nextTierEnds = Number(props.nextTierEnds) || 0;
		this.paymentMethod = Number(props.paymentMethod) || I.PaymentMethod.None;
		this.name = String(props.name || '');
		this.nameType = Number(props.nameType) || I.NameType.Any;
		this.userEmail = String(props.userEmail || '');
		this.subscribeToNewsletter = Boolean(props.subscribeToNewsletter);

		makeObservable(this, {
			tier: observable,
			status: observable,
			dateStarted: observable,
			dateEnds: observable,
			isAutoRenew: observable,
			nextTier: observable,
			nextTierEnds: observable,
			paymentMethod: observable,
			name: observable,
			nameType: observable,
			userEmail: observable,
			subscribeToNewsletter: observable,
		});

		intercept(this as any, change => U.Common.intercept(this, change));
	};

	get isNone (): boolean {
		return this.tier == I.TierType.None;
	};

	get isExplorer (): boolean {
		return this.tier == I.TierType.Explorer;
	};

	get isBuilder (): boolean {
		return [ I.TierType.BuilderTest, I.TierType.Builder ].includes(this.tier);
	};

	get isCreator (): boolean {
		return [ I.TierType.CoCreatorTest, I.TierType.CoCreator ].includes(this.tier);
	};

};

export default Membership;