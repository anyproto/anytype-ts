import { observable, makeObservable } from 'mobx';
import { Mark } from './content/text';
import * as I from 'Interface';

class CommentMessageContent implements I.CommentMessageContent {

	text = '';
	style: I.TextStyle = I.TextStyle.Paragraph;
	marks: I.Mark[] = [];
	parts: I.CommentContentPart[] = [];

	constructor (props: I.CommentMessageContent) {
		this.text = String(props.text || '');
		this.style = Number(props.style) || I.TextStyle.Paragraph;
		this.marks = Array.isArray(props.marks) ? props.marks : [];
		this.parts = Array.isArray(props.parts) ? props.parts : [];

		this.marks = this.marks.map(it => new Mark(it));

		makeObservable(this, {
			text: observable,
			style: observable,
			marks: observable,
			parts: observable,
		});

		return this;
	};

};

class CommentMessage implements I.CommentMessage {

	id = '';
	orderId = '';
	creator = '';
	createdAt = 0;
	modifiedAt = 0;
	replyToMessageId = '';
	content: I.CommentMessageContent = null;
	attachments: I.ChatMessageAttachment[] = [];
	reactions: I.ChatMessageReaction[] = [];
	isSynced = false;
	isReadMessage = false;
	isReadMention = false;
	replyCount = 0;

	constructor (props: I.CommentMessage) {
		this.id = String(props.id || '');
		this.orderId = String(props.orderId || '');
		this.creator = String(props.creator || '');
		this.createdAt = Number(props.createdAt) || 0;
		this.modifiedAt = Number(props.modifiedAt) || 0;
		this.replyToMessageId = String(props.replyToMessageId || '');
		this.content = new CommentMessageContent(props.content || {} as CommentMessageContent);
		this.attachments = Array.isArray(props.attachments) ? props.attachments : [];
		this.reactions = props.reactions || [];
		this.isSynced = Boolean(props.isSynced);
		this.isReadMessage = Boolean(props.isReadMessage);
		this.isReadMention = Boolean(props.isReadMention);
		this.replyCount = Number(props.replyCount) || 0;

		makeObservable(this, {
			id: observable,
			orderId: observable,
			creator: observable,
			modifiedAt: observable,
			replyToMessageId: observable,
			content: observable,
			attachments: observable,
			reactions: observable,
			isSynced: observable,
			isReadMessage: observable,
			isReadMention: observable,
			replyCount: observable,
		});

		return this;
	};

};

export default CommentMessage;
