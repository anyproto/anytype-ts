import { I } from 'ts/lib';

export enum TableAlign {
	None	 = 0,
	Left	 = 1,
	Center	 = 2,
	Right	 = 3,
	Top		 = 4,
	Bottom	 = 5,
};

export interface ContentTable {
};

export interface BlockTable extends I.Block {
	content: ContentTable;
};