import * as I from 'Interface';

export interface ContentIcon {
	name: string;
};

export interface BlockIcon extends I.Block {
	content: ContentIcon;
};