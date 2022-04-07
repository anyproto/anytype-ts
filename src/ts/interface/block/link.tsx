import { I } from 'ts/lib';

export enum LinkCardStyle {
	Text		 = 0,
	Card		 = 1,
};

export enum LinkIconSize {
	VerySmall	 = 0,
	Small		 = 1,
	Medium		 = 2,
	Large		 = 3,
};

export enum LinkDescription {
	None		 = 0,
	Added		 = 1,
	Content		 = 2,
};

export interface ContentLink {
	targetBlockId: string;
	fields: any;
};

export interface BlockLink extends I.Block {
	content: ContentLink;
};