import { describe, it, expect } from 'vitest';
import Comment from './comment';

describe('Comment', () => {

	describe('partsToChatBlocks', () => {
		it('should convert text parts to text blocks', () => {
			const parts = [
				{ text: 'Hello world', style: 0, type: 'text', marks: [] },
			];
			const blocks = Comment.partsToChatBlocks(parts as any);

			expect(blocks).toHaveLength(1);
			expect(blocks[0].text).toBeDefined();
			expect(blocks[0].text.text).toBe('Hello world');
			expect(blocks[0].text.style).toBe(0);
		});

		it('should convert link parts to link blocks', () => {
			const parts = [
				{ link: { targetObjectId: 'abc123' }, text: '', marks: [] },
			];
			const blocks = Comment.partsToChatBlocks(parts as any);

			expect(blocks).toHaveLength(1);
			expect(blocks[0].link).toEqual({ targetObjectId: 'abc123' });
		});

		it('should convert embed parts to embed blocks', () => {
			const parts = [
				{ embed: { processor: 3, url: 'https://youtube.com/watch?v=abc' }, text: '', marks: [] },
			];
			const blocks = Comment.partsToChatBlocks(parts as any);

			expect(blocks).toHaveLength(1);
			expect(blocks[0].embed).toEqual({ processor: 3, url: 'https://youtube.com/watch?v=abc' });
		});

		it('should encode divider parts as text block with ---', () => {
			const parts = [
				{ type: 'div', text: '', marks: [] },
			];
			const blocks = Comment.partsToChatBlocks(parts as any);

			expect(blocks).toHaveLength(1);
			expect(blocks[0].text.text).toBe('---');
			expect(blocks[0].text.style).toBe(0);
		});

		it('should filter out empty text parts', () => {
			const parts = [
				{ text: '', type: 'text', marks: [] },
				{ text: 'keep', type: 'text', marks: [] },
			];
			const blocks = Comment.partsToChatBlocks(parts as any);

			expect(blocks).toHaveLength(1);
			expect(blocks[0].text.text).toBe('keep');
		});

		it('should preserve checked and lang fields', () => {
			const parts = [
				{ text: 'checkbox item', style: 8, type: 'text', marks: [], checked: true, lang: 'python' },
			];
			const blocks = Comment.partsToChatBlocks(parts as any);

			expect(blocks[0].text.checked).toBe(true);
			expect(blocks[0].text.lang).toBe('python');
		});

		it('should handle null/undefined input', () => {
			expect(Comment.partsToChatBlocks(null as any)).toEqual([]);
			expect(Comment.partsToChatBlocks(undefined as any)).toEqual([]);
		});
	});

	describe('blocksToParts', () => {
		it('should convert text blocks to text parts', () => {
			const blocks = [
				{ text: { text: 'Hello', style: 0, marks: [] } },
			];
			const parts = Comment.blocksToParts(blocks as any);

			expect(parts).toHaveLength(1);
			expect(parts[0].text).toBe('Hello');
			expect(parts[0].type).toBe('text');
		});

		it('should convert link blocks to link parts', () => {
			const blocks = [
				{ link: { targetObjectId: 'abc' } },
			];
			const parts = Comment.blocksToParts(blocks as any);

			expect(parts).toHaveLength(1);
			expect(parts[0].type).toBe('link');
			expect(parts[0].link).toEqual({ targetObjectId: 'abc' });
		});

		it('should convert embed blocks to embed parts', () => {
			const blocks = [
				{ embed: { processor: 3, url: 'https://youtube.com' } },
			];
			const parts = Comment.blocksToParts(blocks as any);

			expect(parts).toHaveLength(1);
			expect(parts[0].type).toBe('latex');
			expect(parts[0].embed).toEqual({ processor: 3, url: 'https://youtube.com' });
		});

		it('should decode --- text blocks as dividers', () => {
			const blocks = [
				{ text: { text: '---', style: 0, marks: [] } },
			];
			const parts = Comment.blocksToParts(blocks as any);

			expect(parts).toHaveLength(1);
			expect(parts[0].type).toBe('div');
		});

		it('should not decode --- as divider if it has marks', () => {
			const blocks = [
				{ text: { text: '---', style: 0, marks: [{ type: 3 }] } },
			];
			const parts = Comment.blocksToParts(blocks as any);

			expect(parts[0].type).toBe('text');
			expect(parts[0].text).toBe('---');
		});

		it('should preserve checked and lang', () => {
			const blocks = [
				{ text: { text: 'item', style: 8, marks: [], checked: true, lang: 'js' } },
			];
			const parts = Comment.blocksToParts(blocks as any);

			expect(parts[0].checked).toBe(true);
			expect(parts[0].lang).toBe('js');
		});

		it('should fallback to legacy JSON content', () => {
			const content = {
				text: JSON.stringify({ parts: [{ text: 'legacy', style: 0, type: 'text', marks: [] }] }),
				style: 0,
				marks: [],
			};
			const parts = Comment.blocksToParts([], content as any);

			expect(parts).toHaveLength(1);
			expect(parts[0].text).toBe('legacy');
		});

		it('should fallback to plain text content', () => {
			const content = {
				text: 'plain text message',
				style: 0,
				marks: [{ type: 3 }],
			};
			const parts = Comment.blocksToParts([], content as any);

			expect(parts).toHaveLength(1);
			expect(parts[0].text).toBe('plain text message');
			expect(parts[0].marks).toEqual([{ type: 3 }]);
		});

		it('should return empty array when no blocks and no content', () => {
			expect(Comment.blocksToParts([])).toEqual([]);
			expect(Comment.blocksToParts(null as any)).toEqual([]);
		});
	});

	describe('getDepsIds', () => {
		it('should extract attachment targets', () => {
			const messages = [
				{ attachments: [{ target: 'obj1' }, { target: 'obj2' }], content: {} },
			];
			const ids = Comment.getDepsIds(messages);

			expect(ids).toContain('obj1');
			expect(ids).toContain('obj2');
		});

		it('should extract mention/object mark params', () => {
			const messages = [
				{
					attachments: [],
					content: {
						marks: [
							{ type: 8, param: 'mention1' },
							{ type: 10, param: 'object1' },
							{ type: 3, param: 'ignored' },
						],
					},
				},
			];
			const ids = Comment.getDepsIds(messages);

			expect(ids).toContain('mention1');
			expect(ids).toContain('object1');
			expect(ids).not.toContain('ignored');
		});

		it('should extract link targets from parts', () => {
			const messages = [
				{
					attachments: [],
					content: {
						parts: [{ link: { targetObjectId: 'linked1' }, marks: [] }],
						marks: [],
					},
				},
			];
			const ids = Comment.getDepsIds(messages);

			expect(ids).toContain('linked1');
		});

		it('should deduplicate IDs', () => {
			const messages = [
				{ attachments: [{ target: 'obj1' }, { target: 'obj1' }], content: {} },
			];
			const ids = Comment.getDepsIds(messages);

			expect(ids).toEqual(['obj1']);
		});

		it('should handle null/empty input', () => {
			expect(Comment.getDepsIds(null as any)).toEqual([]);
			expect(Comment.getDepsIds([])).toEqual([]);
		});
	});

	describe('getSubId', () => {
		it('should return object prefix for Object target type', () => {
			// I.CommentTargetType.Object = 0
			expect(Comment.getSubId(0, 'target123')).toBe('comment-object-target123');
		});

		it('should return block prefix for Block target type', () => {
			// I.CommentTargetType.Block = 1
			expect(Comment.getSubId(1, 'target123')).toBe('comment-block-target123');
		});
	});

	describe('getReplySubId', () => {
		it('should return reply subscription ID', () => {
			expect(Comment.getReplySubId('post456')).toBe('comment-reply-post456');
		});
	});

	describe('getPlainText', () => {
		it('should join part texts with newlines', () => {
			const parts = [
				{ text: 'line 1' },
				{ text: 'line 2' },
				{ text: 'line 3' },
			];
			expect(Comment.getPlainText(parts as any)).toBe('line 1\nline 2\nline 3');
		});

		it('should trim result', () => {
			const parts = [{ text: '  hello  ' }];
			expect(Comment.getPlainText(parts as any)).toBe('hello');
		});

		it('should handle empty parts', () => {
			expect(Comment.getPlainText([])).toBe('');
			expect(Comment.getPlainText(null as any)).toBe('');
		});
	});

	describe('docBlocksToParts', () => {
		it('should convert text blocks to parts', () => {
			const blocks = [
				{ type: 'text', content: { text: 'Hello world', style: 0, marks: [] } },
			];
			const parts = Comment.docBlocksToParts(blocks as any);

			expect(parts).toHaveLength(1);
			expect(parts[0].text).toBe('Hello world');
			expect(parts[0].style).toBe(0);
			expect(parts[0].type).toBe('text');
			expect(parts[0].marks).toEqual([]);
		});

		it('should filter out non-text blocks', () => {
			const blocks = [
				{ type: 'text', content: { text: 'keep', style: 0, marks: [] } },
				{ type: 'file', content: { targetObjectId: 'abc' } },
				{ type: 'div', content: {} },
				{ type: 'text', content: { text: 'also keep', style: 0, marks: [] } },
			];
			const parts = Comment.docBlocksToParts(blocks as any);

			expect(parts).toHaveLength(2);
			expect(parts[0].text).toBe('keep');
			expect(parts[1].text).toBe('also keep');
		});

		it('should preserve marks from blocks', () => {
			const blocks = [
				{
					type: 'text',
					content: {
						text: 'bold text',
						style: 0,
						marks: [{ type: 3, range: { from: 0, to: 4 }, param: '' }],
					},
				},
			];
			const parts = Comment.docBlocksToParts(blocks as any);

			expect(parts[0].marks).toHaveLength(1);
			expect(parts[0].marks[0].type).toBe(3); // Bold
			expect(parts[0].marks[0].range).toEqual({ from: 0, to: 4 });
		});

		it('should preserve text style (heading, quote, etc.)', () => {
			const blocks = [
				{ type: 'text', content: { text: 'Heading', style: 1, marks: [] } },
				{ type: 'text', content: { text: 'Quote', style: 5, marks: [] } },
				{ type: 'text', content: { text: 'Code', style: 6, marks: [] } },
			];
			const parts = Comment.docBlocksToParts(blocks as any);

			expect(parts[0].style).toBe(1); // Header1
			expect(parts[1].style).toBe(5); // Quote
			expect(parts[2].style).toBe(6); // Code
		});

		it('should preserve checked field for checkboxes', () => {
			const blocks = [
				{ type: 'text', content: { text: 'checked item', style: 8, marks: [], checked: true } },
				{ type: 'text', content: { text: 'unchecked item', style: 8, marks: [] } },
			];
			const parts = Comment.docBlocksToParts(blocks as any);

			expect(parts[0].checked).toBe(true);
			expect(parts[1].checked).toBeUndefined();
		});

		it('should handle empty content gracefully', () => {
			const blocks = [
				{ type: 'text', content: {} },
				{ type: 'text', content: null },
				{ type: 'text' },
			];
			const parts = Comment.docBlocksToParts(blocks as any);

			expect(parts).toHaveLength(3);
			expect(parts[0].text).toBe('');
			expect(parts[0].style).toBe(0);
			expect(parts[0].marks).toEqual([]);
		});

		it('should handle null/undefined input', () => {
			expect(Comment.docBlocksToParts(null as any)).toEqual([]);
			expect(Comment.docBlocksToParts(undefined as any)).toEqual([]);
		});

		it('should handle multiple marks on a single block', () => {
			const blocks = [
				{
					type: 'text',
					content: {
						text: 'bold and italic',
						style: 0,
						marks: [
							{ type: 3, range: { from: 0, to: 4 }, param: '' },
							{ type: 2, range: { from: 9, to: 15 }, param: '' },
						],
					},
				},
			];
			const parts = Comment.docBlocksToParts(blocks as any);

			expect(parts[0].marks).toHaveLength(2);
			expect(parts[0].marks[0].type).toBe(3); // Bold
			expect(parts[0].marks[1].type).toBe(2); // Italic
		});
	});

	describe('isEmpty', () => {
		it('should return true for null/empty arrays', () => {
			expect(Comment.isEmpty(null as any)).toBe(true);
			expect(Comment.isEmpty([])).toBe(true);
		});

		it('should return true for parts with no text and text type', () => {
			const parts = [
				{ text: '', type: 'text' },
				{ text: '', type: 'text' },
			];
			expect(Comment.isEmpty(parts as any)).toBe(true);
		});

		it('should return false for parts with text', () => {
			const parts = [{ text: 'hello', type: 'text' }];
			expect(Comment.isEmpty(parts as any)).toBe(false);
		});

		it('should return false for non-text type parts even without text', () => {
			const parts = [{ text: '', type: 'link' }];
			expect(Comment.isEmpty(parts as any)).toBe(false);
		});
	});

});
