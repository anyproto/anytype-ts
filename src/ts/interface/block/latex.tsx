import { I } from 'Lib';

export interface ContentLatex {
	text: string;
};

export interface BlockLatex extends I.Block {
	content: ContentLatex;
};