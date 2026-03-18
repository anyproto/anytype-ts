import { I } from 'Lib';

class Comment {

	/**
	 * Converts CommentContentParts into ChatMessageBlocks for the protobuf.
	 */
	partsToBlocks (parts: I.CommentContentPart[]): I.ChatMessageBlock[] {
		parts = (parts || []).filter(it => it.text || it.link || it.embed || (it.type != I.BlockType.Text));

		return parts.map(part => {
			if (part.link) {
				return { link: part.link };
			};

			if (part.embed) {
				return { embed: part.embed };
			};

			// Encode dividers as a text block with marker
			if (part.type == I.BlockType.Div) {
				return { text: { text: '---', style: I.TextStyle.Paragraph, marks: [] } };
			};

			const block: I.ChatMessageBlock = {
				text: {
					text: part.text || '',
					style: part.style || I.TextStyle.Paragraph,
					marks: part.marks || [],
				},
			};

			if (part.checked) {
				block.text.checked = part.checked;
			};

			if (part.lang) {
				block.text.lang = part.lang;
			};

			return block;
		});
	};

	/**
	 * Converts ChatMessageBlocks back into CommentContentParts.
	 * Falls back to legacy JSON-in-text decoding for backward compatibility.
	 */
	blocksToParts (blocks: I.ChatMessageBlock[], content?: I.ChatMessageContent): I.CommentContentPart[] {
		if (blocks && blocks.length) {
			return blocks.filter(it => it.text || it.link || it.embed).map(block => {
				if (block.link) {
					return {
						style: I.TextStyle.Paragraph,
						type: I.BlockType.Link,
						text: '',
						marks: [],
						link: block.link,
					};
				};

				if (block.embed) {
					return {
						style: I.TextStyle.Paragraph,
						type: I.BlockType.Embed,
						text: '',
						marks: [],
						embed: block.embed,
					};
				};

				// Decode divider marker
				if (block.text && (block.text.text === '---') && (!block.text.marks || !block.text.marks.length)) {
					return {
						style: I.TextStyle.Paragraph,
						type: I.BlockType.Div,
						text: '',
						marks: [],
					};
				};

				const part: I.CommentContentPart = {
					text: block.text.text || '',
					style: block.text.style || I.TextStyle.Paragraph,
					type: I.BlockType.Text,
					marks: block.text.marks || [],
				};

				if (block.text.checked) {
					part.checked = block.text.checked;
				};

				if (block.text.lang) {
					part.lang = block.text.lang;
				};

				return part;
			});
		};

		// Legacy fallback: try JSON-encoded parts in content.text
		if (content && content.text) {
			try {
				const parsed = JSON.parse(content.text);
				if (parsed && Array.isArray(parsed.parts)) {
					return parsed.parts;
				};
			} catch (e) {
				// Not JSON - treat as plain text
			};

			return [{
				style: content.style || I.TextStyle.Paragraph,
				type: I.BlockType.Text,
				text: content.text,
				marks: content.marks || [],
			}];
		};

		return [];
	};

	/**
	 * Extracts dependency IDs (attachment targets, mention/object mark params) from messages.
	 */
	getDepsIds (messages: any[]): string[] {
		const markTypes = [ I.MarkType.Object, I.MarkType.Mention ];

		let attachments: string[] = [];
		let marks: any[] = [];

		(messages || []).forEach(it => {
			attachments = attachments.concat((it.attachments || []).map((a: any) => a.target));
			marks = marks.concat(it.content?.marks || []);

			// Also extract link targets from blocks/parts
			const parts = it.content?.parts || [];
			parts.forEach((p: any) => {
				if (p.link?.targetObjectId) {
					attachments.push(p.link.targetObjectId);
				};
				marks = marks.concat(p.marks || []);
			});
		});

		marks = marks.filter(it => markTypes.includes(it.type) && it.param).map(it => it.param);

		return [ ...new Set(attachments.concat(marks).filter(it => it)) ];
	};

	/**
	 * Returns subscription ID for a comment target.
	 */
	getSubId (targetType: I.CommentTargetType, targetId: string): string {
		const prefix = targetType == I.CommentTargetType.Object ? 'object' : 'block';
		return `comment-${prefix}-${targetId}`;
	};

	/**
	 * Returns subscription ID for replies to a post.
	 */
	getReplySubId (postId: string): string {
		return `comment-reply-${postId}`;
	};

	/**
	 * Extracts plain text from parts for display fallback.
	 */
	getPlainText (parts: I.CommentContentPart[]): string {
		return (parts || []).map(it => it.text || '').join('\n').trim();
	};

	/**
	 * Checks if parts array represents empty content.
	 */
	isEmpty (parts: I.CommentContentPart[]): boolean {
		if (!parts || !parts.length) {
			return true;
		};

		return parts.every(it => !it.text && (it.type == I.BlockType.Text));
	};

};

export default new Comment();
