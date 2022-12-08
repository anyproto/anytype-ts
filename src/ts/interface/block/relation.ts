import { I } from 'Lib';

export interface ContentRelation {
	key: string;
};

export interface BlockRelation extends I.Block {
	content: ContentRelation;
};