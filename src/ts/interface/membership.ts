export enum NameType {
	Any						 = 0,
};

export enum MembershipStatus {
	None					 = 0,
	Pending					 = 1,
	Active					 = 2,
	Finalization			 = 3,
};

export interface MembershipAmount {
	currency: string;
	amountCents: number;
};

export interface MembershipPurchasedProduct {
	product: MembershipProduct;
	info: {
		dateStarted: number;
		dateEnds: number;
		isAutoRenew: boolean;
		isYearly: boolean;
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
	getTopProduct?: () => MembershipPurchasedProduct | null;
};

export interface MembershipProduct {
	id: string;
	name: string;
	description: string;
	isTopLevel: boolean;
	isHidden: boolean;
	color: string;
	offer: string;
	pricesYearly: MembershipAmount[];
	pricesMonthly: MembershipAmount[];
	features: {
		storageBytes: number;
		spaceReaders: number;
		spaceWriters: number;
		sharedSpaces: number;
		teamSeats: number;
		anyNameCount: number;
		anyNameMinLen: number;
	};
	featuresList?: { key: string; value: number; }[];
	colorStr?: string;
};