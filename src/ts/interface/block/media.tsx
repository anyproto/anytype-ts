import { I } from 'ts/lib';

export interface ContentMedia {
	link: string;
};

export interface BlockMedia extends I.Block {
	content: ContentMedia;
};