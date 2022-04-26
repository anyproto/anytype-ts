export enum ThreadStatus {
	Unknown	 = 0,
	Offline	 = 1,
	Syncing	 = 2,
	Synced	 = 3,
	Failed	 = 4,
	Disabled = 5,
};

export interface FilesStatus {
	pinning: number;
	pinned: number;
	failed: number;
	updated: number;
}

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
	files: FilesStatus;
};

export interface ThreadObj {
	summary: ThreadSummary;
	cafe: ThreadCafe;
	accounts: ThreadAccount[];
};
