import { I } from 'ts/lib';

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
	marketplaceTypeObjectId: string;
	marketplaceTemplateObjectId: string;
	marketplaceRelationObjectId: string;
	deviceId: string;
	localStoragePath: string;
	timezone: I.Timezone;
};

export interface AccountConfig {
	allowSpaces: boolean;
};

export interface AccountStatus {
	type: AccountStatusType;
	date: number;
};