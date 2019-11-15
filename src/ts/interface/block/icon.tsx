import { I } from 'ts/lib';

export interface ContentIcon {
	name: string;
};

export interface BlockIcon extends I.Block {
	content: ContentIcon;
};