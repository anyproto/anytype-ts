/**
 * @fileoverview Contains the interface "ContentIcon" and related definitions.
 */
import { I } from 'Lib';

export interface ContentIcon {
	name: string;
};

export interface BlockIcon extends I.Block {
	content: ContentIcon;
};