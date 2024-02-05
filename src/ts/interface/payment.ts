export enum SubscriptionTier {
	Unknown	= 0,
	Explorer = 1,

	// these are for testing only, won't require real payment
	Builder1WeekTEST = 2,
	CoCreator1WeekTEST = 3,

	Builder1Year = 4,
	CoCreator1Year = 5,
};
            
export enum SubscriptionStatus {
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