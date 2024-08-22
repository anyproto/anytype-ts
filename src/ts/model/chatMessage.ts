import { I, U } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';
import { Mark } from './content/text';

class ChatMessageContent implements I.ChatMessageContent {

	text = '';
	style: I.TextStyle = I.TextStyle.Paragraph;
	marks: I.Mark[] = [];

	constructor (props: I.ChatMessageContent) {

		this.text = String(props.text || '');
		this.style = Number(props.style) || I.TextStyle.Paragraph;
		this.marks = Array.isArray(props.marks) ? props.marks : [];

		this.marks = this.marks.map(it => new Mark(it));

		makeObservable(this, {
			text: observable,
			style: observable,
			marks: observable,
		});

		intercept(this as any, change => U.Common.intercept(this, change));
	};

};

class ChatMessageAttachment implements I.ChatMessageAttachment {

	target = '';
	type: I.ChatAttachmentType = I.ChatAttachmentType.File;

	constructor (props: I.ChatMessageAttachment) {

		this.target = String(props.target || '');
		this.type = Number(props.type) || I.ChatAttachmentType.File;

		makeObservable(this, {
			target: observable,
			type: observable,
		});

		intercept(this as any, change => U.Common.intercept(this, change));
	};

};

class ChatMessage implements I.ChatMessage {

	id = '';
	orderId = '';
	creator = '';
	replyToMessageId = '';
	content: I.ChatMessageContent = null;
	attachments: I.ChatMessageAttachment[] = [];
	reactions: Map<string, string[]> = null;

	constructor (props: I.ChatMessage) {

		this.id = String(props.id || '');
		this.orderId = String(props.orderId || '');
		this.creator = String(props.creator || '');
		this.replyToMessageId = String(props.replyToMessageId || '');
		this.content = new ChatMessageContent(props.content || {} as ChatMessageContent);
		this.attachments = Array.isArray(props.attachments) ? props.attachments : [];
		this.reactions = new Map(Object.entries(props.reactions || {}));

		this.attachments = this.attachments.map(it => new ChatMessageAttachment(it));

		makeObservable(this, {
			id: observable,
			orderId: observable,
			creator: observable,
			replyToMessageId: observable,
			content: observable,
			attachments: observable,
			reactions: observable,
		});

		intercept(this as any, change => U.Common.intercept(this, change));
	};

};

export default ChatMessage;
