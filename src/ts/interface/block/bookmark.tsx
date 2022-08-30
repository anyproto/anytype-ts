import { I } from 'Lib';

export enum BookmarkState {
	Empty	 = 0,
	Fetching = 1,
	Done	 = 2,
	Error	 = 3,
};

export interface ContentBookmark {
	state: BookmarkState,
	targetObjectId: string;
	url: string;
};

export interface BlockBookmark extends I.Block {
	content: ContentBookmark;
};