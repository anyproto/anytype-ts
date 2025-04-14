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
	type: I.AttachmentType = I.AttachmentType.File;

	constructor (props: I.ChatMessageAttachment) {

		this.target = String(props.target || '');
		this.type = Number(props.type) || I.AttachmentType.File;

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
	createdAt = 0;
	modifiedAt = 0;
	replyToMessageId = '';
	content: I.ChatMessageContent = null;
	attachments: I.ChatMessageAttachment[] = [];
	reactions = [];

	isFirst = false;
	isLast = false;
	isReadMessage = false;
	isReadMention = false;

	constructor (props: I.ChatMessage) {

		this.id = String(props.id || '');
		this.orderId = String(props.orderId || '');
		this.creator = String(props.creator || '');
		this.createdAt = Number(props.createdAt) || 0;
		this.modifiedAt = Number(props.modifiedAt) || 0;
		this.replyToMessageId = String(props.replyToMessageId || '');
		this.content = new ChatMessageContent(props.content || {} as ChatMessageContent);
		this.attachments = Array.isArray(props.attachments) ? props.attachments : [];
		this.reactions = props.reactions || [];
		this.isFirst = Boolean(props.isFirst);
		this.isLast = Boolean(props.isLast);
		this.isReadMessage = Boolean(props.isReadMessage);
		this.isReadMention = Boolean(props.isReadMention);

		this.reactions.sort((c1, c2) => {
			const l1 = c1.authors.length;
			const l2 = c2.authors.length;

			if (l1 > l2) return -1;
			if (l1 < l2) return 1;
			return 0;
		});

		this.attachments = this.attachments.map(it => new ChatMessageAttachment(it));

		makeObservable(this, {
			id: observable,
			orderId: observable,
			creator: observable,
			modifiedAt: observable,
			replyToMessageId: observable,
			content: observable,
			attachments: observable,
			reactions: observable,
			isReadMessage: observable,
			isReadMention: observable,
		});

		intercept(this as any, change => U.Common.intercept(this, change));
	};

};

export default ChatMessage;
