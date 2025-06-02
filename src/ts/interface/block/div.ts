/**
 * @fileoverview Contains the enum "DivStyle" and related definitions.
 */
import { I } from 'Lib';

export enum DivStyle {
	Line	 = 0,
	Dot		 = 1,
};

export interface ContentDiv {
	style: DivStyle;
};

export interface BlockDiv extends I.Block {
	content: ContentDiv;
};