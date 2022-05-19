import { I } from 'ts/lib';

export enum BookmarkType {
	Unknown	 = 0,
	Page	 = 1,
	Image	 = 2,
	Text	 = 3,
};

export interface ContentBookmark {
	url: string;
	title: string;
	description: string;
	imageHash: string;
	faviconHash: string;
	type: BookmarkType;
	targetObjectId: string;
};

export interface BlockBookmark extends I.Block {
	content: ContentBookmark;
};