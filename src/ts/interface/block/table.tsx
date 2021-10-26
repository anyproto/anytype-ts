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

	fill?: () => void;
	sort?: (column: number, sort: I.SortType) => void;
	columnAdd?: (index: number, dir: number) => void;
	columnRemove?: (index: number) => void;
	rowAdd?: (index: number, dir: number) => void;
	rowRemove?: (index: number) => void;
};

export interface BlockTable extends I.Block {
	content: ContentTable;
};