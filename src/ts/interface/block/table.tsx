import { I } from 'ts/lib';

export interface TableColumn {
	name: string;
};

export interface TableRow {
	data: TableRowData[];
};

export interface TableRowData {
	value: string;
};

export interface ContentTable {
	columns: TableColumn[];
	rows: TableRow[];
};

export interface BlockTable extends I.Block {
	content: ContentTable;
};