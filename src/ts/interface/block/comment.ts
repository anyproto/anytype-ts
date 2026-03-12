import { I } from 'Lib';

export enum CommentTargetType {
	Object	 = 0,
	Block	 = 1,
};

export interface CommentContentPart {
	style: I.TextStyle;
	type: I.BlockType;
	text: string;
	marks: I.Mark[];
	checked?: boolean;
	lang?: string;
	link?: {
		targetObjectId: string;
		type: I.ChatMessageBlockLinkType;
	};
	attachmentData?: any;
};

export interface CommentMessage {
	id: string;
	orderId: string;
	creator: string;
	createdAt: number;
	modifiedAt: number;
	replyToMessageId: string;
	content: CommentMessageContent;
	attachments: I.ChatMessageAttachment[];
	reactions: I.ChatMessageReaction[];
	isSynced: boolean;
	replyCount: number;
};

export interface CommentMessageContent {
	text: string;
	style: I.TextStyle;
	marks: I.Mark[];
	parts: CommentContentPart[];
};

export interface CommentSectionProps {
	rootId: string;
	targetId: string;
	targetType: CommentTargetType;
	readonly?: boolean;
	isPopup?: boolean;
};
