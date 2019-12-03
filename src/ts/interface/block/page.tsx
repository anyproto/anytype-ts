import { I } from 'ts/lib';

export enum PageStyle {
	Empty		 = 0,
};

export interface ContentPage {
	style: PageStyle;
};

export interface BlockPage extends I.Block {
	content: ContentPage;
};