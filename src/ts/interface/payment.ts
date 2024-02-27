export enum MembershipTier {
	Unknown	= 0,
	Explorer = 1,

	// these are for testing only, won't require real payment
	Builder1WeekTEST = 2,
	CoCreator1WeekTEST = 3,

	Builder1Year = 4,
	CoCreator1Year = 5,
};
            
export enum MembershipStatus {
	StatusUnknown	 = 0,
	StatusPending	 = 1,
	StatusActive	 = 2,
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
