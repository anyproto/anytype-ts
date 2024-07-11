import { I } from 'Lib';

export enum ChatButton {
	Plus 		= 0,
	Text 		= 1,
	Emoji 		= 2,
	Mention 	= 3,
};

export interface BlockChat extends I.Block {};