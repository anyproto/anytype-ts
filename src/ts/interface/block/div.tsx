import { I } from 'ts/lib';

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