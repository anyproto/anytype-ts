import { I } from 'ts/lib';

export enum LinkStyle {
	Page = 0,
	Dataview = 1,
};

export interface ContentLink {
	targetBlockId: string;
	style: LinkStyle;
	fields: any;
	isArchived: boolean;
};

export interface BlockLink extends I.Block {
	content: ContentLink;
};