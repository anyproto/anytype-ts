import { I } from 'ts/lib';

export enum BookmarkType {
	Unknown	 = 0,
	Page	 = 1,
	Image	 = 2,
	Text	 = 3,
}

export interface ContentBookmark {
	type: BookmarkType;
	url: string;
	title: string;
	description: string;
	imageHash: string;
	faviconHash: string;
};

export interface BlockBookmark extends I.Block {
	content: ContentBookmark;
};