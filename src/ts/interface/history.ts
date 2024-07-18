export enum DiffType {
	None	 = 0,
	Add		 = 1,
	Change	 = 2,
	Remove	 = 3,
};

export interface Diff {
	type: string;
	data: any;
};