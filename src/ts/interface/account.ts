/**
 * @fileoverview Contains the enum "AccountStatusType" and related definitions.
 */
export enum AccountStatusType {
        Active                   = 0, // Account is fully active
        PendingDeletion  = 1, // Deletion has been requested
        StartedDeletion  = 2, // Deletion process has begun
        Deleted                  = 3, // Account has been removed
};

export interface Account {
	id: string;
	info?: AccountInfo;
	config?: AccountConfig;
	status?: AccountStatus;
};

export interface AccountInfo {
	homeObjectId: string;
	profileObjectId: string;
	gatewayUrl: string;
	deviceId: string;
	localStoragePath: string;
	accountSpaceId: string;
	techSpaceId: string;
	spaceViewId: string;
	widgetsId: string;
	analyticsId: string;
	networkId: string;
	workspaceObjectId: string;
	ethereumAddress: string;
};

export interface AccountConfig {
};

export interface AccountStatus {
	type: AccountStatusType;
	date: number; // The UNIX timestamp of when the account is set to be deleted
};