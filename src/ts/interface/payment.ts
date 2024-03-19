/*
message Membership {
    enum Tier {
        TierNewUser = 0;
        // "free" tier
        TierExplorer = 1;
        // this tier can be used just for testing in debug mode
        // it will still create an active subscription, but with NO features
        TierBuilder1WeekTEST = 2;
        // this tier can be used just for testing in debug mode
        // it will still create an active subscription, but with NO features
        TierCoCreator1WeekTEST = 3;
        TierBuilder = 4;
        TierCoCreator = 5;
    }
    
    enum Status {
        StatusUnknown = 0;
        // please wait a bit more
        StatusPending = 1;
        StatusActive = 2;
        // in some cases we need to finalize the process:
        // - if user has bought membership directly without first calling
        // the BuySubscription method
        // 
        // in this case please call Finalize to finish the process
        StatusPendingRequiresFinalization = 3;
    }
    
    enum PaymentMethod {
        MethodCard = 0;
        MethodCrypto = 1;
        MethodApplePay = 2;
        MethodGooglePay = 3;
        MethodAppleInapp = 4;
        MethodGoogleInapp = 5;
    }

    // it was Tier before, changed to int32 to allow dynamic values
    int32 tier = 1;
    Status status = 2;
    uint64 dateStarted = 3;
    uint64 dateEnds = 4;
    bool isAutoRenew = 5;
    PaymentMethod paymentMethod = 6;
    // can be empty if user did not ask for any name
    string requestedAnyName = 7;
    // if the email was verified by the user or set during the checkout - it will be here
    string userEmail = 8;
    bool subscribeToNewsletter = 9;
}

message MembershipTierData {
    enum PeriodType {
        PeriodTypeUnknown = 0;
        PeriodTypeUnlimited = 1;
        PeriodTypeDays = 2;
        PeriodTypeWeeks = 3;
        PeriodTypeMonths = 4;
        PeriodTypeYears = 5;  
    }
    
    message Feature {
        // usually feature has uint value
        // like "storage" - 120
        uint32 valueUint = 1;

        // in case feature will have string value
        string valueStr = 2;
    }

    // this is a unique ID of the tier
    // you should hardcode this in your app and provide icon, graphics, etc for each tier 
    // (even for old/historical/inactive/hidden tiers)
    uint32 id = 1;
    // localazied name of the tier
    string name = 2;
    // just a short technical description
    // you don't have to use it, you can use your own UI-friendly texts
    string description = 3;
    // can you buy it (ON ALL PLATFORMS, without clarification)?
    bool isActive = 4;
    // is this tier for debugging only?
    bool isTest = 5;  
    // hidden tiers are only visible once user got them
    bool isHiddenTier = 6;
    // how long is the period of the subscription
    PeriodType periodType = 7;
    // i.e. "5 days" or "3 years"
    uint32 periodValue = 8;
    // this one is a price we use ONLY on Stripe platform
    uint32 priceStripeUsdCents = 9;
    // number of ANY NS names that this tier includes 
    // (not counted as a "feature" and not in the features list)
    uint32 anyNamesCountIncluded = 10;
    // somename.any - len of 8
    uint32 anyNameMinLength = 11;
    // each tier has a set of features
    // each feature has a unique key: "storage", "invites", etc
    // not using enum here to provide dynamic feature list:
    // 
    // "stoageGB" -> {64, ""}
    // "invites" -> {120, ""}
    // "spaces-public" -> {10, ""}
    // ...
    map<string, Feature> features = 12;
}
*/

export enum MembershipTier {
	None				 = 0,
	Explorer			 = 1,

	// these are for testing only, won't require real payment
	Builder1WeekTEST	 = 2,
	CoCreator1WeekTEST	 = 3,

	Builder1Year		 = 4,
	CoCreator1Year		 = 5,
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
            
export enum MembershipStatus {
	Unknown			 = 0,
	Pending			 = 1,
	Active			 = 2,
};
            
export enum PaymentMethod {
	MethodCard		 = 0,
	MethodCrypto	 = 1,
	MethodApplePay	 = 2,
	MethodGooglePay	 = 3,
};

export enum MembershipPrice {
	Price1Year 		= 99,
	Price5Years 	= 399,
};

export enum MembershipPeriod {
	Period1Year 	= 1,
	Period5Years 	= 5,
};
