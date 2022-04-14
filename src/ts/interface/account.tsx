export enum AccountStatusType {
	Active			 = 0,
    PendingDeletion	 = 1,
	StartedDeletion	 = 2,
    Deleted			 = 3,
};

export interface Account {
	id: string;
	config?: AccountConfig;
	status?: AccountStatus;
};

export interface AccountConfig {
	allowSpaces: boolean;
};

export interface AccountStatus {
	type: AccountStatusType;
	date: number;
};