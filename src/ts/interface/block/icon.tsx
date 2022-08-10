import { I } from 'Lib';

export interface ContentIcon {
	name: string;
};

export interface BlockIcon extends I.Block {
	content: ContentIcon;
};