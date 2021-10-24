import { I } from 'ts/lib';

export enum TableAlign {
	Left	 = 0,
	Right	 = 1,
	Center	 = 2,
	Top		 = 3,
	Bottom	 = 4,
};

export interface TableColumn {
	value: string;
	horizontal: TableAlign;
	vertical: TableAlign;
	width: number;
};

export interface TableCell {
	value: string;
	horizontal: TableAlign;
	vertical: TableAlign;
};

export interface TableRow {
	cells: TableCell[];
	horizontal: TableAlign;
	vertical: TableAlign;
};

export interface ContentTable {
	columns: TableColumn[];
	rows: TableRow[];
};

export interface BlockTable extends I.Block {
	content: ContentTable;
};