import { I } from 'ts/lib';

export enum TableAlign {
	None	 = 0,
	Left	 = 1,
	Center	 = 2,
	Right	 = 3,
	Top		 = 4,
	Bottom	 = 5,
};

export interface BlockComponentTable extends I.BlockComponent {
	isHead?: boolean;
	getData: () => any;
	onOptions: (e: any, id: string) => void;
	onClick: (e: any, id: string) => void;
	onCellFocus: (e: any, id: string) => void;
	onCellBlur: (e: any, id: string) => void;
	onSort: (e: any, id: string, sort: I.SortType) => void;
	onResizeStart: (e: any, id: string) => void;
};

export interface ContentTable {
};

export interface BlockTable extends I.Block {
	content: ContentTable;
};