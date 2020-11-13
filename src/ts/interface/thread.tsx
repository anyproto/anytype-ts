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
	id: string;
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