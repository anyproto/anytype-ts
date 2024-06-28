import { I } from 'Lib';

export enum EmbedProcessor {
	Latex			 = 0,
	Mermaid			 = 1,
	Chart			 = 2,
	Youtube			 = 3,
	Vimeo			 = 4,
	Soundcloud		 = 5,
	GoogleMaps 		 = 6,
	Miro 	 		 = 7,
	Figma 	 		 = 8,
	Twitter			 = 9,
	OpenStreetMap	 = 10,
	Reddit			 = 11,
	Facebook		 = 12,
	Instagram		 = 13,
	Telegram		 = 14,
	GithubGist		 = 15,
	Codepen			 = 16,
	Bilibili		 = 17,
	Excalidraw		 = 18,
	Kroki 			 = 19,
	Graphviz		 = 20,
	Sketchfab		 = 21,
	Image			 = 22,
};

export interface ContentEmbed {
	text: string;
	processor: EmbedProcessor;
}

export interface BlockEmbed extends I.Block {
	content: ContentEmbed;
};
