import { I } from 'ts/lib';

export interface ContentTable {
};

export interface BlockTable extends I.Block {
	content: ContentTable;
};