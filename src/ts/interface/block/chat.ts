import { I } from 'Lib';

export enum ChatButton {
	Object 		= 0,
	Text 		= 1,
	Emoji 		= 2,
	Mention 	= 3,
};

export interface ChatMessage {
	id: string;
	author: string;
	text: string;
	data: any;
};

export interface BlockChat extends I.Block {};