import { I } from 'ts/lib';

export interface ContentRelation {
	key: string;
};

export interface BlockRelation extends I.Block {
	content: ContentRelation;
};