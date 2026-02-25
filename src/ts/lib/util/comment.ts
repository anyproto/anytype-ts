import { I } from 'Lib';

class Comment {

	/**
	 * Encodes parts into ChatMessageContent format for storage via Chat middleware.
	 * Parts array is serialized as JSON in the text field.
	 */
	encodeParts (parts: I.CommentContentPart[]): I.ChatMessageContent {
		parts = (parts || []).filter(it => it.text || (it.type != I.BlockType.Text));

		const text = JSON.stringify({ parts });
		const style = parts.length ? parts[0].style : I.TextStyle.Paragraph;

		return {
			text,
			style,
			marks: [],
		};
	};

	/**
	 * Decodes ChatMessageContent back into parts.
	 * Falls back to treating text as plain text if not valid JSON.
	 */
	decodeParts (content: I.ChatMessageContent): I.CommentContentPart[] {
		if (!content || !content.text) {
			return [];
		};

		try {
			const parsed = JSON.parse(content.text);
			if (parsed && Array.isArray(parsed.parts)) {
				return parsed.parts;
			};
		} catch (e) {
			// Not JSON - treat as plain text (backward compat with regular chat messages)
		};

		return [{
			style: content.style || I.TextStyle.Paragraph,
			type: I.BlockType.Text,
			text: content.text,
			marks: content.marks || [],
		}];
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
