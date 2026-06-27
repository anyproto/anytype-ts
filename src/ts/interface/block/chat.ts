import * as I from 'Interface';


export enum ChatButton {
	Object 		 = 0,
	Text 		 = 1,
	Emoji 		 = 2,
	Mention 	 = 3,
};

export enum AttachmentType {
	File		 = 0, 
	Image		 = 1,
	Link		 = 2,
};

export interface ChatStateCounter {
	orderId: string;
	counter: number;
};

export interface ChatState {
	messages: ChatStateCounter;
	mentions: ChatStateCounter;
	reactionOrderId: string;
	lastStateId: string;
	order: number;
};

export interface ChatStoreState {
	messageOrderId: string;
	messageCounter: number;
	mentionOrderId: string;
	mentionCounter: number;
	reactionOrderId: string;
	reactionCounter: number;
	lastStateId: string;
	order: number;
};

export interface ChatCounter {
	mentionCounter: number;
	messageCounter: number;
	reactionCounter: number;
};

export enum ChatReadType {
	Message = 0,
	Mention = 1,
	Reaction = 2,
};

export interface ChatMessageReaction {
	icon: string;
	authors: string[];
};

export interface ChatMessage {
	id: string;
	chatId: string;
	orderId: string;
	creator: string;
	createdAt: number;
	modifiedAt: number;
	replyToMessageId: string;
	content: ChatMessageContent;
	attachments: ChatMessageAttachment[];
	dependencies: Map<string, any>;
	reactions: ChatMessageReaction[];
	blocks: ChatMessageBlock[];
	isSynced: boolean;
	isPinned: boolean;

	// Internal
	isFirst: boolean;
	isLast: boolean;
	isReadMessage: boolean;
	isReadMention: boolean;
	isReadReaction: boolean;
	hasMention: boolean;
};

export interface ChatMessageBlock {
	text?: ChatMessageBlockText;
	link?: ChatMessageBlockLink;
	embed?: ChatMessageBlockEmbed;
	editorQuote?: ChatMessageBlockEditorQuote;
	messageQuote?: ChatMessageBlockMessageQuote;
};

export interface ChatMessageBlockText {
	text: string;
	style: I.TextStyle;
	marks: I.Mark[];
	checked?: boolean;
	lang?: string;
};

export interface ChatMessageBlockEmbed {
	text: string;
	processor: I.EmbedProcessor;
};

export interface ChatMessageBlockLink {
	targetObjectId: string;
	type: ChatMessageBlockLinkType;
};

export interface ChatMessageBlockEditorQuote {
	blockId: string;
	content: ChatMessageBlockText;
};

export interface ChatMessageBlockMessageQuote {
	messageId: string;
	content: ChatMessageBlockText;
};

export enum ChatMessageBlockLinkType {
	Object		 = 0,
	File		 = 1,
	Image		 = 2,
	Bookmark	 = 3,
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
	subId: string;
	analyticsChatId?: string;
	style?: any;
	onContextMenu: (e: any, id: string) => void;
	onMore: (e: any, id: string) => void;
	onReplyEdit: (e: any, id: string) => void;
	onReplyClick: (e: any, id: string) => void;
	getReplyContent: (message: any) => any;
	scrollToBottom: () => void;
	getMessageMenuOptions: (message: I.ChatMessage, noControls: boolean, url?: string, targetId?: string) => I.Option[];
};

export interface BlockChat extends I.Block {};
