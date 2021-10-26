import { I } from 'ts/lib';

export enum TableAlign {
	Left	 = 0,
	Right	 = 1,
	Center	 = 2,
	Top		 = 3,
	Bottom	 = 4,
};

export interface TableCell {
	value: string;
	horizontal?: TableAlign;
	vertical?: TableAlign;
	color?: string;
	background?: string;
	width?: number;
};

export interface TableRow {
	cells: TableCell[];
	isHead?: boolean;

	fill?: (columnCount: number) => TableRow;
};

export interface ContentTable {
	columnCount: number;
	sortIndex: number;
	sortType: I.SortType;
	rows: TableRow[];

	sort?: () => void;
};

export interface BlockTable extends I.Block {
	content: ContentTable;
};