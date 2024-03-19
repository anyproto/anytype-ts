export enum MembershipTier {
	None				 = 0,
	Explorer			 = 1,
	BuilderTest			 = 2,
	CoCreatorTest		 = 3,
	Builder				 = 4,
	CoCreator			 = 5,
};

export enum MembershipStatus {
	Unknown			 = 0,
	Pending			 = 1,
	Active			 = 2,
	Finalization	 = 3,
};

export enum PaymentMethod {
	Card		 = 0,
	Crypto		 = 1,
	ApplePay	 = 2,
	GooglePay	 = 3,
	AppleInapp	 = 4,
	GoogleInapp	 = 5,
};

export enum MembershipPrice {
	Price1Year 		= 99,
	Price5Years 	= 399,
};

export enum MembershipPeriod {
	Period1Year 	= 1,
	Period5Years 	= 5,
};

export interface Membership {
	tier: MembershipTier;
	status: MembershipStatus;
	dateStarted?: number;
	dateEnds?: number;
	isAutoRenew?: boolean;
	nextTier?: MembershipTier;
	nextTierEnds?: number;
	paymentMethod?: PaymentMethod,
	requestedAnyName?: string;
};

export interface MembershipTierItem {
	id?: MembershipTier;
	idx?: number;
	price?: MembershipPrice;
	period?: MembershipPeriod;
	minNameLength?: number;
};