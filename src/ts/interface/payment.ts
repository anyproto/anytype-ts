export enum TierType {
	None					 = 0,
	Explorer				 = 1,
	BuilderTest				 = 2,
	CoCreatorTest			 = 3,
	Builder					 = 4,
	CoCreator				 = 5,
};

export enum MembershipStatus {
	Unknown					 = 0,
	Pending					 = 1,
	Active					 = 2,
	Finalization			 = 3,
};

export enum PaymentMethod {
	Card					 = 0,
	Crypto					 = 1,
	ApplePay				 = 2,
	GooglePay				 = 3,
	AppleInapp				 = 4,
	GoogleInapp				 = 5,
};

export enum MembershipPeriod {
	Period1Year 			 = 1,
	Period5Years 			 = 5,
};

export enum MembershipTierDataFeatureId {
	Unknown 				 = 0,
	StorageGBs 				 = 1,
	Invites 				 = 2,
	SpaceWriters 			 = 3,
	SpaceReaders 			 = 4,
	SharedSpaces 			 = 5,
};

export enum MembershipTierDataPeriodType {
	PeriodTypeUnknown 		 = 0,
	PeriodTypeUnlimited 	 = 1,
	PeriodTypeDays 			 = 2,
	PeriodTypeWeeks 		 = 3,
	PeriodTypeMonths 		 = 4,
	PeriodTypeYears 		 = 5,
};

export interface Membership {
	tier?: TierType;
	status?: MembershipStatus;
	dateStarted?: number;
	dateEnds?: number;
	isAutoRenew?: boolean;
	nextTier?: TierType;
	nextTierEnds?: number;
	paymentMethod?: PaymentMethod,
	requestedAnyName?: string;
	userEmail?: string;
	subscribeToNewsletter?: boolean;
	isNone?: boolean;
	isExplorer?: boolean;
	isBuilder?: boolean;
	isCreator?: boolean;
};

export interface MembershipTier {
	id: TierType;
	name: string;
	description: string;
	colorStr: string;
	nameMinLength: number;
	isTest: boolean;
	periodType: number;
	period: number;
	priceCents: number;
	features: string[];
	color?: string;
	price?: number;
	isExplorer?: boolean;
	isBuilder?: boolean;
	isCreator?: boolean;
};