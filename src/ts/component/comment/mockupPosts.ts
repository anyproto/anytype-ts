import { I } from 'Lib';

/**
 * Static mockup posts demonstrating all block capabilities.
 * Used for development/testing purposes.
 */

const makeParts = (parts: I.CommentContentPart[]): I.CommentMessageContent => {
	return {
		text: JSON.stringify({ parts }),
		style: parts.length ? parts[0].style : I.TextStyle.Paragraph,
		marks: [],
		parts,
	};
};

const mockupPosts: I.CommentMessage[] = [
	{
		id: 'mockup-1',
		orderId: '001',
		creator: '',
		createdAt: Math.floor(Date.now() / 1000) - 3600,
		modifiedAt: 0,
		replyToMessageId: '',
		content: makeParts([
			{
				style: I.TextStyle.Header1,
				type: I.BlockType.Text,
				text: 'Rich Text Showcase',
				marks: [],
			},
			{
				style: I.TextStyle.Paragraph,
				type: I.BlockType.Text,
				text: 'This paragraph has bold, italic, underline, strikethrough, and inline code formatting.',
				marks: [
					{ type: I.MarkType.Bold, range: { from: 19, to: 23 }, param: '' },
					{ type: I.MarkType.Italic, range: { from: 25, to: 31 }, param: '' },
					{ type: I.MarkType.Underline, range: { from: 33, to: 42 }, param: '' },
					{ type: I.MarkType.Strike, range: { from: 44, to: 57 }, param: '' },
					{ type: I.MarkType.Code, range: { from: 63, to: 74 }, param: '' },
				],
			},
		]),
		attachments: [],
		reactions: [],
		isSynced: true,
		replyCount: 0,
	},
	{
		id: 'mockup-2',
		orderId: '002',
		creator: '',
		createdAt: Math.floor(Date.now() / 1000) - 2400,
		modifiedAt: 0,
		replyToMessageId: '',
		content: makeParts([
			{
				style: I.TextStyle.Header2,
				type: I.BlockType.Text,
				text: 'Lists Demo',
				marks: [],
			},
			{
				style: I.TextStyle.Bulleted,
				type: I.BlockType.Text,
				text: 'First bulleted item',
				marks: [],
			},
			{
				style: I.TextStyle.Bulleted,
				type: I.BlockType.Text,
				text: 'Second bulleted item with bold text',
				marks: [
					{ type: I.MarkType.Bold, range: { from: 27, to: 31 }, param: '' },
				],
			},
			{
				style: I.TextStyle.Bulleted,
				type: I.BlockType.Text,
				text: 'Third bulleted item',
				marks: [],
			},
			{
				style: I.TextStyle.Numbered,
				type: I.BlockType.Text,
				text: 'Step one',
				marks: [],
			},
			{
				style: I.TextStyle.Numbered,
				type: I.BlockType.Text,
				text: 'Step two',
				marks: [],
			},
			{
				style: I.TextStyle.Numbered,
				type: I.BlockType.Text,
				text: 'Step three',
				marks: [],
			},
			{
				style: I.TextStyle.Checkbox,
				type: I.BlockType.Text,
				text: 'Completed task',
				marks: [],
				checked: true,
			},
			{
				style: I.TextStyle.Checkbox,
				type: I.BlockType.Text,
				text: 'Pending task',
				marks: [],
				checked: false,
			},
			{
				style: I.TextStyle.Checkbox,
				type: I.BlockType.Text,
				text: 'Another pending task',
				marks: [],
				checked: false,
			},
		]),
		attachments: [],
		reactions: [],
		isSynced: true,
		replyCount: 0,
	},
	{
		id: 'mockup-3',
		orderId: '003',
		creator: '',
		createdAt: Math.floor(Date.now() / 1000) - 1200,
		modifiedAt: 0,
		replyToMessageId: '',
		content: makeParts([
			{
				style: I.TextStyle.Header3,
				type: I.BlockType.Text,
				text: 'Code & Quotes',
				marks: [],
			},
			{
				style: I.TextStyle.Quote,
				type: I.BlockType.Text,
				text: 'The best way to predict the future is to invent it.',
				marks: [
					{ type: I.MarkType.Italic, range: { from: 0, to: 51 }, param: '' },
				],
			},
			{
				style: I.TextStyle.Paragraph,
				type: I.BlockType.Div,
				text: '',
				marks: [],
			},
			{
				style: I.TextStyle.Code,
				type: I.BlockType.Text,
				text: 'function greet(name: string) {\n  return `Hello, ${name}!`;\n}',
				marks: [],
			},
			{
				style: I.TextStyle.Paragraph,
				type: I.BlockType.Div,
				text: '',
				marks: [],
			},
			{
				style: I.TextStyle.Paragraph,
				type: I.BlockType.Text,
				text: 'That code snippet shows a simple TypeScript function.',
				marks: [
					{ type: I.MarkType.Code, range: { from: 5, to: 17 }, param: '' },
				],
			},
		]),
		attachments: [],
		reactions: [],
		isSynced: true,
		replyCount: 0,
	},
	{
		id: 'mockup-4',
		orderId: '004',
		creator: '',
		createdAt: Math.floor(Date.now() / 1000) - 600,
		modifiedAt: 0,
		replyToMessageId: '',
		content: makeParts([
			{
				style: I.TextStyle.Header2,
				type: I.BlockType.Text,
				text: 'Mixed Content',
				marks: [],
			},
			{
				style: I.TextStyle.Paragraph,
				type: I.BlockType.Text,
				text: 'Here is a paragraph introducing some key points about the project.',
				marks: [
					{ type: I.MarkType.Bold, range: { from: 48, to: 57 }, param: '' },
				],
			},
			{
				style: I.TextStyle.Bulleted,
				type: I.BlockType.Text,
				text: 'Performance improvements',
				marks: [],
			},
			{
				style: I.TextStyle.Bulleted,
				type: I.BlockType.Text,
				text: 'Better error handling',
				marks: [],
			},
			{
				style: I.TextStyle.Bulleted,
				type: I.BlockType.Text,
				text: 'New block types for comments',
				marks: [],
			},
			{
				style: I.TextStyle.Quote,
				type: I.BlockType.Text,
				text: 'This feature will greatly improve collaboration.',
				marks: [],
			},
			{
				style: I.TextStyle.Paragraph,
				type: I.BlockType.Div,
				text: '',
				marks: [],
			},
			{
				style: I.TextStyle.Paragraph,
				type: I.BlockType.Text,
				text: 'Let me know if you have any questions!',
				marks: [],
			},
		]),
		attachments: [],
		reactions: [],
		isSynced: true,
		replyCount: 0,
	},
	{
		id: 'mockup-5',
		orderId: '005',
		creator: '',
		createdAt: Math.floor(Date.now() / 1000) - 300,
		modifiedAt: 0,
		replyToMessageId: '',
		content: makeParts([
			{
				style: I.TextStyle.Paragraph,
				type: I.BlockType.Text,
				text: 'A simple plain text comment to show the basic case still works perfectly.',
				marks: [],
			},
		]),
		attachments: [],
		reactions: [],
		isSynced: true,
		replyCount: 0,
	},
];

export default mockupPosts;
