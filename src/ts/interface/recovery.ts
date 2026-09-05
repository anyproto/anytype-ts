/**
 * Account start-up status (Event.Account.Recovery.*, Rpc.Account.RecoveryState).
 * Enum values mirror the middleware proto; unknown values must be ignored, never mapped to a default.
 */

export enum RecoveryMode {
	Unknown		 = 0,
	Cold		 = 1,
	Warm		 = 2,
	NewAccount	 = 3,
};

export enum RecoveryPhase {
	LookingForPeers		 = 0,
	Connecting			 = 1,
	FetchingAccount		 = 2,
	LoadingSpaces		 = 3,
	Done				 = 4,
	WaitingForNetwork	 = 5,
	Failed				 = 6,
	/** The idle snapshot (empty runId): no run has begun in this process. Never rendered */
	NotStarted			 = 7,
};

export enum RecoveryErrorClass {
	None				 = 0,
	NoNetwork			 = 1,
	PeerUnreachable		 = 2,
	IncompatibleVersion	 = 3,
	NotAuthorized		 = 4,
	SpaceDeleted		 = 5,
	AccountDeleted		 = 6,
	AccountNotFound		 = 7,
	RateLimited			 = 8,
	StorageLimit		 = 9,
	Unexpected			 = 10,
};

export enum RecoveryPeerKind {
	Local		 = 0,
	Network		 = 1,
};

export enum RecoveryDirection {
	Outbound	 = 0,
	Inbound		 = 1,
};

export enum RecoverySpaceKind {
	Regular		 = 0,
	Tech		 = 1,
};

export enum RecoverySpaceState {
	Queued		 = 0,
	Pulling		 = 1,
	Loading		 = 2,
	Loaded		 = 3,
	Error		 = 4,
	Removed		 = 5,
};

export enum RecoveryDiscoveryState {
	Possible		 = 0,
	NoInterfaces	 = 1,
	Restricted		 = 2,
};

/** The middleware's headline for the LAN layer, folded from every local peer's dial and exchange */
export enum RecoveryLocalPeersState {
	NoLocalPeers		 = 0,
	Connecting			 = 1,
	Unreachable			 = 2,
	AccountNotFound		 = 3,
	AccountFound		 = 4,
};

/** Payload kinds of Event.Account.Recovery.Update, named after the proto oneof fields */
export enum RecoveryUpdateType {
	Started					 = 'started',
	PhaseChanged			 = 'phaseChanged',
	LocalDiscoveryState		 = 'localDiscoveryState',
	PeerDiscovered			 = 'peerDiscovered',
	DialStarted				 = 'dialStarted',
	PeerConnected			 = 'peerConnected',
	DialFailed				 = 'dialFailed',
	PeerDisconnected		 = 'peerDisconnected',
	AccountFetchStarted		 = 'accountFetchStarted',
	AccountFetchError		 = 'accountFetchError',
	AccountReady			 = 'accountReady',
	SpaceDiscovered			 = 'spaceDiscovered',
	SpaceStateChanged		 = 'spaceStateChanged',
	Finished				 = 'finished',
	Snapshot				 = 'snapshot',
	PeerSpaceExchange		 = 'peerSpaceExchange',
	LocalPeersStateChanged	 = 'localPeersStateChanged',
};

export enum RecoveryLineType {
	Phase		 = 0,
	ColdStart	 = 1,
	Finished	 = 2,
	LocalPeers	 = 3,
};

export interface RecoveryError {
	class: RecoveryErrorClass;
	retryable: boolean;
	/** raw error text for logs only, never rendered */
	debugMessage: string;
};

export interface RecoveryPeer {
	peerId: string;
	kind: RecoveryPeerKind;
	nodeTypes: string[];
	openConnections: number;
	transport: string;
	protoVersion: number;
	dialAttempts: number;
	lastError: RecoveryError;
	discoveredLocally: boolean;
	/** a LAN space exchange answered; the two fields below apply only then */
	exchanged: boolean;
	hasAccountSpace: boolean;
	sharedSpaceCount: number;
};

export interface RecoverySpace {
	spaceId: string;
	spaceViewId: string;
	kind: RecoverySpaceKind;
	state: RecoverySpaceState;
	error: RecoveryError;
	attempt: number;
};

export interface RecoverySnapshot {
	runId: string;
	lastEventId: number;
	mode: RecoveryMode;
	networkId: string;
	startedAtMs: number;
	phase: RecoveryPhase;
	phaseStartedAtMs: number;
	done: boolean;
	error: RecoveryError;
	discovery: RecoveryDiscoveryState;
	accountFetchStarted: boolean;
	accountReady: boolean;
	peers: RecoveryPeer[];
	spaces: RecoverySpace[];
	spacesTotal: number;
	spacesLoaded: number;
	spacesFailed: number;
	viewsConfirmed: boolean;
	accountFetchAttempt: number;
	accountFetchError: RecoveryError;
	localPeers: RecoveryLocalPeersState;
};

export interface RecoveryUpdate {
	runId: string;
	id: number;
	timestampMs: number;
	type: RecoveryUpdateType | string;
	data: any;
};

/** One line of the start-up status ticker. Text is resolved by the component, not stored */
export interface RecoveryLine {
	id: number;
	type: RecoveryLineType;
	phase?: RecoveryPhase;
	errorClass?: RecoveryErrorClass;
	attempt?: number;
	loaded?: number;
	total?: number;
	viewsConfirmed?: boolean;
	localPeers?: RecoveryLocalPeersState;
};
