export enum ThreadStatus {
	Unknown	 = 0,
	Offline	 = 1,
	Syncing	 = 2,
	Synced	 = 3,
	Failed	 = 4,
};

export interface ThreadSummary {
	status: ThreadStatus;
};

export interface ThreadDevice {
	name: string;
	online: boolean;
	lastPulled: number;
	lastEdited: number;
};

export interface ThreadAccount {
	name: string;
	imageHash: string;
	online: false;
	lastPulled: number;
	lastEdited: number;
	devices: ThreadDevice[];
};

export interface ThreadCafe {
	status: ThreadStatus;
	lastPulled: number;
	lastPushSucceed: boolean;
};

export interface ThreadObj {
	summary: ThreadSummary;
	cafe: ThreadCafe;
	accounts: ThreadAccount[];
};