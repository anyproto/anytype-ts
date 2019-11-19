import { I } from 'ts/lib';

export enum PageStyle {
	Empty		 = 0,
	Set			 = 1,
	Task		 = 2,
	Header3		 = 3,
	Header4		 = 4,
	Quote		 = 5,
	Code		 = 6,
	Title		 = 7,
};

export interface ContentPage {
	style: PageStyle;
};

export interface BlockPage extends I.Block {
	content: ContentPage;
};