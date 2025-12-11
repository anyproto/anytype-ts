export enum NameType {
	Any						 = 0,
};

export enum MembershipStatus {
	None					 = 0,
	Pending					 = 1,
	Active					 = 2,
	Finalization			 = 3,
};

export enum MembershipPeriod {
	Unlimited				 = 0,
	Monthly					 = 1,
	Yearly					 = 2,
	ThreeYears				 = 3,
};

export enum PaymentProvider {
	None					 = 0,
	Stripe					 = 1,
	Crypto					 = 2,
	BillingPortal			 = 3,
	AppStore				 = 4,
	GooglePlay				 = 5,
};

export interface MembershipAmount {
	currency: string;
	amountCents: number;
};

export interface MembershipPurchasedProduct {
	product: { id: string; };
	info: {
		dateStarted: number;
		dateEnds: number;
		isAutoRenew: boolean;
		period: MembershipPeriod;
	};
	status: MembershipStatus;
	isNone?: boolean;
	isActive?: boolean;
	isPending?: boolean;
	isFinalization?: boolean;
};

export interface MembershipData {
	products: MembershipPurchasedProduct[];
	nextInvoice: {
		date: number;
		total: MembershipAmount;
	};
	teamOwnerId: string;
	paymentProvider: PaymentProvider;
	getTopProduct?: () => MembershipProduct | null;
	getTopPurchasedProduct?: () => MembershipPurchasedProduct | null;
};

export interface MembershipProduct {
	id: string;
	name: string;
	description: string;
	isTopLevel: boolean;
	isIntro: boolean;
	isHidden: boolean;
	isUpgradeable?: boolean;
	color: string;
	offer: string;
	pricesYearly: MembershipAmount[];
	pricesMonthly: MembershipAmount[];
	features: {
		storageBytes: number;
		spaceReaders: number;
		spaceWriters: number;
		sharedSpaces: number;
		privateSpaces: number;
		teamSeats: number;
		anyNameCount: number;
		anyNameMinLen: number;
	};
	featuresList?: { key: string; value: number; }[];
	colorStr?: string;
	getPrice?: (isYearly: boolean) => MembershipAmount | null;
	getPriceString?: (isYearly: boolean) => string;
};
