import { I } from 'Lib';

class Comment {

	/**
	 * Converts CommentContentParts into ChatMessageBlocks for the protobuf.
	 */
	partsToBlocks (parts: I.CommentContentPart[]): I.ChatMessageBlock[] {
		parts = (parts || []).filter(it => it.text || (it.type != I.BlockType.Text));

		return parts.map(part => ({
			text: {
				text: part.text || '',
				style: part.style || I.TextStyle.Paragraph,
				marks: part.marks || [],
			},
		}));
	};

	/**
	 * Converts ChatMessageBlocks back into CommentContentParts.
	 * Falls back to legacy JSON-in-text decoding for backward compatibility.
	 */
	blocksToParts (blocks: I.ChatMessageBlock[], content?: I.ChatMessageContent): I.CommentContentPart[] {
		if (blocks && blocks.length) {
			return blocks.filter(it => it.text).map(block => ({
				text: block.text.text || '',
				style: block.text.style || I.TextStyle.Paragraph,
				type: I.BlockType.Text,
				marks: block.text.marks || [],
			}));
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
