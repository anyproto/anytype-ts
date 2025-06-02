/**
 * @fileoverview Contains the enum "SyncStatusSpace" and related definitions.
 */
export enum SyncStatusSpace {
        Synced                                   = 0, // Space is synced
        Syncing                                  = 1, // Sync in progress
        Error                                    = 2, // Sync error
        Offline                                  = 3, // No connection
        Upgrade                                  = 4, // Requires upgrade
};

export enum SyncStatusObject {
        Synced                                   = 0, // Object is synced
        Syncing                                  = 1, // Syncing object
        Error                                    = 2, // Error occurred
        Queued                                   = 3, // Waiting to sync
};

export enum SyncStatusNetwork {
        Anytype                                  = 0, // Anytype cloud network
        SelfHost                                 = 1, // Self-hosted network
        LocalOnly                                = 2, // Local storage only
};

export enum SyncStatusError {
        None                                     = 0, // No error
        StorageLimitExceed               = 1, // Storage limit exceeded
        IncompatibleVersion              = 2, // App version mismatch
        NetworkError                     = 3, // Network failure
};

export interface SyncStatus {
	id: string;
	status: SyncStatusSpace;
	network: SyncStatusNetwork;
	error: SyncStatusError;
	p2p: P2PStatus;
	syncingCounter: number;
	devicesCounter: number;
};

export enum P2PStatus {
        NotConnected    = 0, // No P2P connection
        NotPossible     = 1, // P2P not available
        Connected               = 2, // Connected via P2P
};

export interface P2PSyncStatus {
	id: string;
	status: P2PStatus;
};
