export enum SyncStatusSpace {
	Synced		 = 0,
	Syncing		 = 1,
	Error		 = 2,
	Offline		 = 3,
};

export enum SyncStatusObject {
	Synced		 = 0,
	Syncing		 = 1,
	Error		 = 2,
	Queued 		 = 3,
};

export enum SyncStatusNetwork {
	Anytype   		= 0,
	SelfHost  		= 1,
	LocalOnly 		= 2,
};

export enum SyncStatusError {
	None 		 			= 0,
	StorageLimitExceed 		= 1,
	IncompatibleVersion		= 2,
	NetworkError 			= 3,
};

export interface SyncStatus {
	status: SyncStatusSpace,
	network: SyncStatusNetwork,
	error: SyncStatusError,
	syncingCounter: number
};
