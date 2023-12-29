import { I } from 'Lib';

export enum EmbedProcessor {
	Latex		 = 0,
	Mermaid		 = 1,
	Chart		 = 2,
	Youtube		 = 3,
	Vimeo		 = 4,
	Soundcloud	 = 5,
	GoogleMaps 	 = 6,
	Miro 	 	 = 7,
	Figma 	 	 = 8,
};

export interface ContentEmbed {
	text: string;
	processor: EmbedProcessor;
}

export interface BlockEmbed extends I.Block {
	content: ContentEmbed;
};
