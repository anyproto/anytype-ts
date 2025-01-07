import { I } from 'Lib';

export enum ChatButton {
	Object 		 = 0,
	Text 		 = 1,
	Emoji 		 = 2,
	Mention 	 = 3,
	Voice		 = 4,
};

export enum AttachmentType {
	File		 = 0, 
	Image		 = 1,
	Link		 = 2,
};

export interface ChatMessage {
	id: string;
	orderId: string;
	creator: string;
	createdAt: number;
	modifiedAt: number;
	replyToMessageId: string;
	content: ChatMessageContent;
	attachments: ChatMessageAttachment[];
	reactions: any;

	// Internal
	isFirst: boolean;
	isLast: boolean;
};

export interface ChatMessageContent {
	text: string;
	style: I.TextStyle;
	marks: I.Mark[];
};

export interface ChatMessageAttachment {
	target: string;
	type: AttachmentType;
};

export interface ChatMessageComponent extends I.BlockComponent {
	blockId: string;
	id: string;
	isNew: boolean;
	subId: string
	scrollToBottom?: () => void;
	onContextMenu: (e: any) => void;
	onMore: (e: any) => void;
	onReplyEdit: (e: any) => void;
	onReplyClick: (e: any) => void;
	getReplyContent: (message: any) => any;
};

export interface BlockChat extends I.Block {};