import * as I from 'Interface';

class Comment {

	/**
	 * Converts CommentContentParts into ChatMessageBlocks for the protobuf.
	 */
	partsToChatBlocks (parts: I.CommentContentPart[]): I.ChatMessageBlock[] {
		parts = (parts || []).filter(it => it.text || it.link || it.embed || it.editorQuote || it.messageQuote || (it.type != I.BlockType.Text));

		return parts.map(part => {
			const buildQuoteContent = (): I.ChatMessageBlockText => ({
				text: part.text || '',
				style: I.TextStyle.Quote,
				marks: part.marks || [],
			});

			if (part.editorQuote) {
				return { editorQuote: { blockId: part.editorQuote.blockId, content: buildQuoteContent() } };
			};

			if (part.messageQuote) {
				return { messageQuote: { messageId: part.messageQuote.messageId, content: buildQuoteContent() } };
			};

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
			return blocks.filter(it => it.text || it.link || it.embed || it.editorQuote || it.messageQuote).map(block => {
				if (block.editorQuote) {
					const content = block.editorQuote.content || ({} as I.ChatMessageBlockText);
					return {
						style: I.TextStyle.Quote,
						type: I.BlockType.Text,
						text: content.text || '',
						marks: content.marks || [],
						editorQuote: { blockId: block.editorQuote.blockId },
					};
				};

				if (block.messageQuote) {
					const content = block.messageQuote.content || ({} as I.ChatMessageBlockText);
					return {
						style: I.TextStyle.Quote,
						type: I.BlockType.Text,
						text: content.text || '',
						marks: content.marks || [],
						messageQuote: { messageId: block.messageQuote.messageId },
					};
				};

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
	 * Converts standard document blocks (I.Block[]) into CommentContentParts.
	 */
	docBlocksToParts (blocks: I.Block[]): I.CommentContentPart[] {
		return (blocks || []).filter(it => it.type == I.BlockType.Text).map(block => {
			const part: I.CommentContentPart = {
				text: block.content?.text || '',
				style: block.content?.style || I.TextStyle.Paragraph,
				type: I.BlockType.Text,
				marks: block.content?.marks || [],
			};

			if (block.content?.checked) {
				part.checked = block.content.checked;
			};

			return part;
		});
	};

	/**
	 * Converts CommentContentParts into standard document blocks (I.Block[]) for BlockCopy.
	 */
	partsToBlocks (parts: I.CommentContentPart[]): I.Block[] {
		return (parts || []).filter(it => it.text || it.link || it.embed || (it.type !== I.BlockType.Text)).map((p, i) => {
			if (p.link) {
				return {
					id: `copy-${i}`,
					type: I.BlockType.Link,
					childrenIds: [],
					content: {
						targetBlockId: p.link.targetObjectId,
					},
				};
			};

			if (p.type === I.BlockType.Div) {
				return {
					id: `copy-${i}`,
					type: I.BlockType.Div,
					childrenIds: [],
					content: {},
				};
			};

			const block: any = {
				id: `copy-${i}`,
				type: I.BlockType.Text,
				childrenIds: [],
				content: {
					text: p.text || '',
					style: p.style || I.TextStyle.Paragraph,
					marks: p.marks || [],
					checked: p.checked || false,
				},
			};

			if (p.lang) {
				block.content.lang = p.lang;
			};

			return block;
		});
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

	/**
	 * Smooth-scrolls the editor block with the given id into view and briefly highlights it.
	 */
	scrollToBlock (blockId: string): void {
		if (!blockId) {
			return;
		};

		const el = U.Dom.get(`block-${blockId}`);
		if (!el) {
			return;
		};

		el.scrollIntoView({ behavior: 'smooth', block: 'center' });
		U.Dom.addClass(el, 'isHighlighted');
		window.setTimeout(() => U.Dom.removeClass(el, 'isHighlighted'), 2000);
	};

	/**
	 * Smooth-scrolls the comment message with the given id into view and briefly highlights it.
	 */
	scrollToMessage (messageId: string): void {
		if (!messageId) {
			return;
		};

		const el = U.Dom.select(`[data-message-id="${messageId}"]`) as HTMLElement | null;
		if (!el) {
			return;
		};

		el.scrollIntoView({ behavior: 'smooth', block: 'center' });
		U.Dom.addClass(el, 'isHighlighted');
		window.setTimeout(() => U.Dom.removeClass(el, 'isHighlighted'), 2000);
	};

};

export default new Comment();
