/**
 * @fileoverview Contains the enum "NameType" and related definitions.
 */
export enum NameType {
        Any                                              = 0, // Any available name
};

export enum TierType {
        None                                     = 0, // No tier assigned
	Explorer                                 = 1, // Explorer tier
	BuilderTest				 = 2,
	CoCreatorTest			 = 3,
	Builder                                  = 4, // Builder tier
	CoCreator                                = 5, // CoCreator tier
	BuilderPlus				 = 6,
	AnytypeTeam                              = 7, // Internal team tier
	AnytypeBetaUsers		 = 8,
	Builder2for1			 = 9,
	AnyPioneer				 = 16,
	NewExplorer                              = 20, // Updated explorer tier
	Starter					 = 21,
	Pioneer					 = 22,
};

export enum MembershipStatus {
	Unknown                                  = 0, // Status unknown
	Pending                                  = 1, // Payment pending
	Active                                   = 2, // Membership active
	Finalization                     = 3, // Ending membership
};

export enum PaymentMethod {
        None                                     = 0, // No payment method
	Stripe                                   = 1, // Stripe payments
	Crypto                                   = 2, // Cryptocurrency payments
	Apple                                    = 3, // Apple payments
	Google                                   = 4, // Google payments
};

export enum MembershipTierDataFeatureId {
        Unknown                                  = 0, // Unknown feature
	StorageGBs 				 = 1,
	Invites 				 = 2,
	SpaceWriters 			 = 3,
	SpaceReaders 			 = 4,
	SharedSpaces 			 = 5,
};

export enum MembershipTierDataPeriodType {
        PeriodTypeUnknown                = 0, // Unknown period
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
	name?: string;
	nameType?: NameType;
	userEmail?: string;
	subscribeToNewsletter?: boolean;
	isNone?: boolean;
	isStarter?: boolean;
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
	periodType: MembershipTierDataPeriodType;
	period: number;
	priceCents: number;
	features: string[];
	namesCount: number;
	offer?: string;
	color?: string;
	price?: number;
	isStarter?: boolean;
	isBuilder?: boolean;
	isCreator?: boolean;
};
