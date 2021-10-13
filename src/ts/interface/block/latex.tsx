import { I } from 'ts/lib';

export interface ContentLatex {
	text: string;
};

export interface BlockLatex extends I.Block {
	content: ContentLatex;
};