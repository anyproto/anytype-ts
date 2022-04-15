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
	homeBlockId: string;
	profileBlockId: string;
	gatewayUrl: string;
	marketplaceTypeId: string;
	marketplaceTemplateId: string;
	marketplaceRelationId: string;
	deviceId: string;
};

export interface AccountConfig {
	allowSpaces: boolean;
};

export interface AccountStatus {
	type: AccountStatusType;
	date: number;
};