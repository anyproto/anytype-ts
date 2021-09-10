import { I } from 'ts/lib';

export enum LinkStyle {
	Page		 = 0,
	Dataview	 = 1,
	Dashboard	 = 2,
};

export enum LinkCardStyle {
	Text		 = 0,
	Card		 = 1,
};

export enum LinkIconSize {
	VerySmall	 = 0,
	Small		 = 1,
	Medium		 = 2,
	Large		 = 3,
}

export interface ContentLink {
	targetBlockId: string;
	style: LinkStyle;
	fields: any;
};

export interface BlockLink extends I.Block {
	content: ContentLink;
};