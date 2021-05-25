import { I } from 'ts/lib';

export interface ContentBookmark {
	url: string;
	title: string;
	description: string;
	imageHash: string;
	faviconHash: string;
};

export interface BlockBookmark extends I.Block {
	content: ContentBookmark;
};