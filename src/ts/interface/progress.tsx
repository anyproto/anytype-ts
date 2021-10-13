export enum ProgressType {
	File	 = 0,
	Import	 = 1,
	Export	 = 2,
	Download = 3,
	Recover	 = 4,
};

export enum ProgressState {
	None	 = 0,
	Running	 = 1,
	Done	 = 2,
	Canceled = 3,
	Error	 = 4,
}

export interface Progress {
	id?: string;
	type?: ProgressType;
	status?: string;
	current?: number;
	total?: number;
	isUnlocked?: boolean;
	canCancel?: boolean;
};