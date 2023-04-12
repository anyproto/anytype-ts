export enum AccountStatusType {
	Active			 = 0,
    PendingDeletion	 = 1,
	StartedDeletion	 = 2,
    Deleted			 = 3,
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
	widgetsId: string;
};

export interface AccountConfig {
	allowSpaces: boolean;
	allowBeta: boolean;
};

export interface AccountStatus {
	type: AccountStatusType;
	/** The UNIX timestamp of when the account is set to be deleted */
	date: number;
};