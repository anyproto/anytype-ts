export enum DiffType {
	None	 = 0,
	Add		 = 1,
	Change	 = 2,
};

export interface Diff {
	type: string;
	data: any;
};