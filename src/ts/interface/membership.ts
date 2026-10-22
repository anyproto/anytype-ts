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
	Lifetime				 = 4,
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
	/** the product embedded in the status, so status alone can render the purchased plan */
	product: MembershipProduct | null;
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
	isElapsed?: boolean;
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
	getUnresolvedProducts?: () => MembershipPurchasedProduct[];
	resolveProduct?: (item: MembershipPurchasedProduct) => MembershipProduct | null;
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
	pricesLifetime: MembershipAmount[];
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
	iconName?: string;
	getPrice?: (period: MembershipPeriod) => MembershipAmount | null;
	getPriceString?: (period: MembershipPeriod) => string;
};

/**
 * Freshness of one membership resource (status or products), as served by the middleware.
 * The protobuf zero value is Fresh, so a payload that never set it keeps its old meaning.
 */
export enum MembershipFreshness {
	Fresh					 = 0,
	Stale					 = 1,
	None					 = 2,
};

/**
 * Class of the latest failed refresh of a resource.
 */
export enum MembershipRefreshError {
	Null					 = 0,
	PaymentNode				 = 1,
	Unknown					 = 2,
};

/**
 * Orders published states of one resource. The epoch changes on every payments service start,
 * it is kept as a string so a 64-bit value never loses precision.
 */
export interface MembershipRevision {
	epoch: string;
	counter: number;
};

export interface MembershipFetchState {
	freshness: MembershipFreshness;
	lastSuccessfulFetchAt: number;
	lastRefreshError: MembershipRefreshError;
	revision: MembershipRevision | null;
};

export enum MembershipResource {
	Status					 = 'status',
	Products				 = 'products',
};

/**
 * Why no request was sent for a resource.
 */
export enum MembershipBlock {
	None					 = '',
	Offline					 = 'offline',
	NotAnytypeNetwork		 = 'notAnytypeNetwork',
};

/**
 * What a screen can render for one resource.
 */
export enum MembershipView {
	Pending					 = 'pending',
	Usable					 = 'usable',
	Unavailable				 = 'unavailable',
	Offline					 = 'offline',
	NotAnytypeNetwork		 = 'notAnytypeNetwork',
};

/**
 * Client-side state of one membership resource. Usable data stays on screen while a retry is
 * pending or after a later failure; the view is derived from this state, see MembershipStore.getView.
 */
export interface MembershipResourceState {
	/** usable data is held: FRESH or STALE, including a successfully fetched empty result */
	known: boolean;
	/** freshness as last served by the middleware (None while nothing usable was served) */
	freshness: MembershipFreshness;
	lastSuccessfulFetchAt: number;
	lastRefreshError: MembershipRefreshError;
	/** middleware error code of the latest accepted response, 0 if none */
	errorCode: number;
	/** transport error or watchdog timeout that no later server answer has superseded, 0 if none */
	clientErrorCode: number;
	/** latest accepted server revision */
	revision: MembershipRevision | null;
	/** requests in flight that the watchdog has not given up on */
	inFlight: number;
	/** set when the latest attempt was not sent */
	block: MembershipBlock;
	/** a request was sent at least once in this session */
	attempted: boolean;
};

/**
 * Taken when a request starts: the result is ordered against it.
 */
export interface MembershipTicket {
	resource: MembershipResource;
	session: number;
	gen: number;
	revision: MembershipRevision | null;
	settled: boolean;
};
