import { I } from 'Lib';

export enum EmbedProcessor {
	Latex		 = 0,
	Mermaid		 = 1,
};

export interface ContentEmbed {
	text: string;
	processor: EmbedProcessor;
};

export interface BlockEEmbed extends I.Block {
	content: ContentEmbed;
};