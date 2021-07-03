import { I } from 'ts/lib';

export enum LinkStyle {
	Page		 = 0,
	Dataview	 = 1,
	Dashboard	 = 2,
};

export interface ContentLink {
	targetBlockId: string;
	style: LinkStyle;
	fields: any;
};

export interface BlockLink extends I.Block {
	content: ContentLink;
};