import { I } from 'Lib';

export enum ChatButton {
	Object 		 = 0,
	Text 		 = 1,
	Emoji 		 = 2,
	Mention 	 = 3,
};

export enum ChatAttachmentType {
	File		 = 0, 
	Image		 = 1,
	Link		 = 2,
};

export interface ChatMessage {
	id: string;
	orderId: string;
	creator: string;
	createdAt: number;
	replyToMessageId: string;
	content: ChatMessageContent;
	attachments: ChatMessageAttachment[];
	reactions: any;
};

export interface ChatMessageContent {
	text: string;
	style: I.TextStyle;
	marks: I.Mark[];
};

export interface ChatMessageAttachment {
	target: string;
	type: ChatAttachmentType;
};

export interface BlockChat extends I.Block {};