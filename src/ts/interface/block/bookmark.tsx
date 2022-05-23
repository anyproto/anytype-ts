import { I } from 'ts/lib';

export interface ContentBookmark {
	targetObjectId: string;
};

export interface BlockBookmark extends I.Block {
	content: ContentBookmark;
};