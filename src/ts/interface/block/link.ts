import * as I from 'Interface';

export enum LinkCardStyle {
	Text		 = 0,
	Card		 = 1,
	Inline		 = 2,
};

export enum LinkDefaultStyle {
	Text		 = 0,
	Card		 = 1,
	CardMedium	 = 2,
};

export enum LinkIconSize {
	None		 = 0,
	Small		 = 1,
	Medium		 = 2,
};

export enum LinkDescription {
	None		 = 0,
	Added		 = 1,
	Content		 = 2,
};

export interface ContentLink {
	targetBlockId: string;
	iconSize: LinkIconSize,
	cardStyle: LinkCardStyle,
	description: LinkDescription,
	relations: string[];
};

export interface BlockLink extends I.Block {
	content: ContentLink;
};