import { I } from 'ts/lib';

export interface ContentIcon {
	icon: string;
};

export interface BlockIcon extends I.Block {
	content: ContentIcon;
};