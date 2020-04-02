export enum ProgressType {
	File = 0,
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
	current?: any;
	total?: any;
	isUnlocked?: boolean;
	canCancel?: boolean;
};