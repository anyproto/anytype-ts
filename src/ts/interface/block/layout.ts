import { I } from 'Lib';

export enum LayoutStyle {
	Row				 = 0,
	Column			 = 1,
	Div				 = 2,
	Header			 = 3,
	TableRows		 = 4,
	TableColumns	 = 5,
};

export interface ContentLayout {
	style: LayoutStyle;
};

export interface BlockLayout extends I.Block {
	content: ContentLayout;
};