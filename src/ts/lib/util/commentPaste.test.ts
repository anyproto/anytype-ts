import { describe, it, expect, beforeAll } from 'vitest';
import * as I from 'Interface';

/**
 * This is the exact same transformation logic used in commentEditor.tsx PasteUrlPlugin
 * when handling anytype JSON blocks from the clipboard. Extracted here for testing.
 *
 * Clipboard JSON structure (from Mapper.From.Block):
 * {
 *   range: { from: number, to: number },
 *   blocks: [
 *     {
 *       type: 'text',       // I.BlockType.Text = 'text'
 *       bgColor: string,    // block-level background color
 *       content: {
 *         text: string,
 *         style: number,    // I.TextStyle enum
 *         marks: I.Mark[],
 *         color: string,    // block-level text color
 *         checked: boolean,
 *       }
 *     }
 *   ]
 * }
 */
const clipboardBlocksToParts = (blocks: any[]): I.CommentContentPart[] => {
	return blocks
		.filter((b: any) => (b.type == I.BlockType.Text) && b.content && b.content.text)
		.map((b: any) => {
			const text = b.content.text || '';
			const marks = (b.content.marks || []).slice();
			const length = text.length;

			if (b.content.color && length) {
				marks.push({ type: I.MarkType.Color, param: b.content.color, range: { from: 0, to: length } });
			};

			if (b.bgColor && length) {
				marks.push({ type: I.MarkType.BgColor, param: b.bgColor, range: { from: 0, to: length } });
			};

			return {
				text,
				style: b.content.style || I.TextStyle.Paragraph,
				type: I.BlockType.Text,
				marks,
				checked: b.content.checked,
			};
		});
};

describe('clipboardBlocksToParts (paste transformation)', () => {

	describe('basic text blocks', () => {
		it('should convert a simple text block', () => {
			const blocks = [
				{ type: 'text', content: { text: 'Hello world', style: 0, marks: [] } },
			];
			const parts = clipboardBlocksToParts(blocks);

			expect(parts).toHaveLength(1);
			expect(parts[0].text).toBe('Hello world');
			expect(parts[0].style).toBe(I.TextStyle.Paragraph);
			expect(parts[0].type).toBe(I.BlockType.Text);
			expect(parts[0].marks).toEqual([]);
		});

		it('should convert multiple text blocks', () => {
			const blocks = [
				{ type: 'text', content: { text: 'First', style: 0, marks: [] } },
				{ type: 'text', content: { text: 'Second', style: 0, marks: [] } },
				{ type: 'text', content: { text: 'Third', style: 0, marks: [] } },
			];
			const parts = clipboardBlocksToParts(blocks);

			expect(parts).toHaveLength(3);
			expect(parts[0].text).toBe('First');
			expect(parts[1].text).toBe('Second');
			expect(parts[2].text).toBe('Third');
		});

		it('should filter out non-text blocks', () => {
			const blocks = [
				{ type: 'text', content: { text: 'keep', style: 0, marks: [] } },
				{ type: 'file', content: { targetObjectId: 'abc' } },
				{ type: 'div', content: {} },
				{ type: 'bookmark', content: { url: 'https://example.com' } },
				{ type: 'text', content: { text: 'also keep', style: 0, marks: [] } },
			];
			const parts = clipboardBlocksToParts(blocks);

			expect(parts).toHaveLength(2);
			expect(parts[0].text).toBe('keep');
			expect(parts[1].text).toBe('also keep');
		});

		it('should filter out blocks without content', () => {
			const blocks = [
				{ type: 'text' },
				{ type: 'text', content: null },
				{ type: 'text', content: { text: 'valid', style: 0, marks: [] } },
			];
			const parts = clipboardBlocksToParts(blocks);

			expect(parts).toHaveLength(1);
			expect(parts[0].text).toBe('valid');
		});
	});

	describe('marks preservation', () => {
		it('should preserve bold marks', () => {
			const blocks = [
				{
					type: 'text',
					content: {
						text: 'bold text',
						style: 0,
						marks: [{ type: I.MarkType.Bold, range: { from: 0, to: 4 }, param: '' }],
					},
				},
			];
			const parts = clipboardBlocksToParts(blocks);

			expect(parts[0].marks).toHaveLength(1);
			expect(parts[0].marks[0].type).toBe(I.MarkType.Bold);
			expect(parts[0].marks[0].range).toEqual({ from: 0, to: 4 });
		});

		it('should preserve multiple marks', () => {
			const blocks = [
				{
					type: 'text',
					content: {
						text: 'bold and italic',
						style: 0,
						marks: [
							{ type: I.MarkType.Bold, range: { from: 0, to: 4 }, param: '' },
							{ type: I.MarkType.Italic, range: { from: 9, to: 15 }, param: '' },
						],
					},
				},
			];
			const parts = clipboardBlocksToParts(blocks);

			expect(parts[0].marks).toHaveLength(2);
			expect(parts[0].marks[0].type).toBe(I.MarkType.Bold);
			expect(parts[0].marks[1].type).toBe(I.MarkType.Italic);
		});

		it('should preserve link marks with params', () => {
			const blocks = [
				{
					type: 'text',
					content: {
						text: 'click here',
						style: 0,
						marks: [{ type: I.MarkType.Link, range: { from: 0, to: 10 }, param: 'https://example.com' }],
					},
				},
			];
			const parts = clipboardBlocksToParts(blocks);

			expect(parts[0].marks[0].type).toBe(I.MarkType.Link);
			expect(parts[0].marks[0].param).toBe('https://example.com');
		});

		it('should preserve mention marks', () => {
			const blocks = [
				{
					type: 'text',
					content: {
						text: '@User',
						style: 0,
						marks: [{ type: I.MarkType.Mention, range: { from: 0, to: 5 }, param: 'user-id-123' }],
					},
				},
			];
			const parts = clipboardBlocksToParts(blocks);

			expect(parts[0].marks[0].type).toBe(I.MarkType.Mention);
			expect(parts[0].marks[0].param).toBe('user-id-123');
		});

		it('should not mutate original marks array', () => {
			const originalMarks = [{ type: I.MarkType.Bold, range: { from: 0, to: 4 }, param: '' }];
			const blocks = [
				{
					type: 'text',
					content: { text: 'bold', style: 0, marks: originalMarks, color: 'red' },
				},
			];
			clipboardBlocksToParts(blocks);

			// Original marks should not have the color mark added
			expect(originalMarks).toHaveLength(1);
		});
	});

	describe('color to mark conversion', () => {
		it('should convert content.color to Color mark', () => {
			const blocks = [
				{
					type: 'text',
					content: { text: 'red text', style: 0, marks: [], color: 'red' },
				},
			];
			const parts = clipboardBlocksToParts(blocks);

			expect(parts[0].marks).toHaveLength(1);
			expect(parts[0].marks[0]).toEqual({
				type: I.MarkType.Color,
				param: 'red',
				range: { from: 0, to: 8 },
			});
		});

		it('should convert bgColor to BgColor mark', () => {
			const blocks = [
				{
					type: 'text',
					bgColor: 'yellow',
					content: { text: 'highlighted', style: 0, marks: [] },
				},
			];
			const parts = clipboardBlocksToParts(blocks);

			expect(parts[0].marks).toHaveLength(1);
			expect(parts[0].marks[0]).toEqual({
				type: I.MarkType.BgColor,
				param: 'yellow',
				range: { from: 0, to: 11 },
			});
		});

		it('should convert both color and bgColor', () => {
			const blocks = [
				{
					type: 'text',
					bgColor: 'yellow',
					content: { text: 'colorful', style: 0, marks: [], color: 'red' },
				},
			];
			const parts = clipboardBlocksToParts(blocks);

			expect(parts[0].marks).toHaveLength(2);

			const colorMark = parts[0].marks.find((m: any) => m.type === I.MarkType.Color);
			const bgColorMark = parts[0].marks.find((m: any) => m.type === I.MarkType.BgColor);

			expect(colorMark).toEqual({ type: I.MarkType.Color, param: 'red', range: { from: 0, to: 8 } });
			expect(bgColorMark).toEqual({ type: I.MarkType.BgColor, param: 'yellow', range: { from: 0, to: 8 } });
		});

		it('should append color marks after existing marks', () => {
			const blocks = [
				{
					type: 'text',
					bgColor: 'blue',
					content: {
						text: 'bold red',
						style: 0,
						marks: [{ type: I.MarkType.Bold, range: { from: 0, to: 4 }, param: '' }],
						color: 'red',
					},
				},
			];
			const parts = clipboardBlocksToParts(blocks);

			expect(parts[0].marks).toHaveLength(3);
			expect(parts[0].marks[0].type).toBe(I.MarkType.Bold);
			expect(parts[0].marks[1].type).toBe(I.MarkType.Color);
			expect(parts[0].marks[2].type).toBe(I.MarkType.BgColor);
		});

		it('should filter out blocks with empty text', () => {
			const blocks = [
				{
					type: 'text',
					bgColor: 'yellow',
					content: { text: '', style: 0, marks: [], color: 'red' },
				},
			];
			const parts = clipboardBlocksToParts(blocks);

			expect(parts).toHaveLength(0);
		});

		it('should NOT add color mark when color is falsy', () => {
			const blocks = [
				{ type: 'text', content: { text: 'no color', style: 0, marks: [], color: '' } },
				{ type: 'text', content: { text: 'no color', style: 0, marks: [], color: null } },
				{ type: 'text', content: { text: 'no color', style: 0, marks: [] } },
			];
			const parts = clipboardBlocksToParts(blocks);

			parts.forEach(p => {
				expect(p.marks).toEqual([]);
			});
		});

		it('should NOT add bgColor mark when bgColor is falsy', () => {
			const blocks = [
				{ type: 'text', bgColor: '', content: { text: 'no bg', style: 0, marks: [] } },
				{ type: 'text', bgColor: null, content: { text: 'no bg', style: 0, marks: [] } },
				{ type: 'text', content: { text: 'no bg', style: 0, marks: [] } },
			];
			const parts = clipboardBlocksToParts(blocks);

			parts.forEach(p => {
				expect(p.marks).toEqual([]);
			});
		});
	});

	describe('text styles', () => {
		it('should preserve heading styles', () => {
			const blocks = [
				{ type: 'text', content: { text: 'H1', style: I.TextStyle.Header1, marks: [] } },
				{ type: 'text', content: { text: 'H2', style: I.TextStyle.Header2, marks: [] } },
				{ type: 'text', content: { text: 'H3', style: I.TextStyle.Header3, marks: [] } },
			];
			const parts = clipboardBlocksToParts(blocks);

			expect(parts[0].style).toBe(I.TextStyle.Header1);
			expect(parts[1].style).toBe(I.TextStyle.Header2);
			expect(parts[2].style).toBe(I.TextStyle.Header3);
		});

		it('should preserve list styles', () => {
			const blocks = [
				{ type: 'text', content: { text: 'bullet', style: I.TextStyle.Bulleted, marks: [] } },
				{ type: 'text', content: { text: 'numbered', style: I.TextStyle.Numbered, marks: [] } },
				{ type: 'text', content: { text: 'checked', style: I.TextStyle.Checkbox, marks: [], checked: true } },
			];
			const parts = clipboardBlocksToParts(blocks);

			expect(parts[0].style).toBe(I.TextStyle.Bulleted);
			expect(parts[1].style).toBe(I.TextStyle.Numbered);
			expect(parts[2].style).toBe(I.TextStyle.Checkbox);
			expect(parts[2].checked).toBe(true);
		});

		it('should preserve quote and code styles', () => {
			const blocks = [
				{ type: 'text', content: { text: 'quoted', style: I.TextStyle.Quote, marks: [] } },
				{ type: 'text', content: { text: 'code', style: I.TextStyle.Code, marks: [] } },
			];
			const parts = clipboardBlocksToParts(blocks);

			expect(parts[0].style).toBe(I.TextStyle.Quote);
			expect(parts[1].style).toBe(I.TextStyle.Code);
		});

		it('should default to Paragraph when style is missing', () => {
			const blocks = [
				{ type: 'text', content: { text: 'no style', marks: [] } },
			];
			const parts = clipboardBlocksToParts(blocks);

			expect(parts[0].style).toBe(I.TextStyle.Paragraph);
		});
	});

	describe('realistic clipboard data scenarios', () => {
		it('should handle a real editor copy with colored text and bold marks', () => {
			// This is the exact structure from Mapper.From.Block when copying colored bold text
			const blocks = [
				{
					id: 'block-1',
					type: 'text',
					childrenIds: [],
					fields: {},
					hAlign: 0,
					vAlign: 0,
					bgColor: '',
					content: {
						text: 'This is red bold text',
						style: 0,
						checked: false,
						color: 'red',
						marks: [
							{ type: I.MarkType.Bold, range: { from: 8, to: 21 }, param: '' },
						],
						iconEmoji: '',
						iconImage: '',
					},
				},
			];
			const parts = clipboardBlocksToParts(blocks);

			expect(parts).toHaveLength(1);
			expect(parts[0].text).toBe('This is red bold text');
			expect(parts[0].marks).toHaveLength(2);
			expect(parts[0].marks[0]).toEqual({ type: I.MarkType.Bold, range: { from: 8, to: 21 }, param: '' });
			expect(parts[0].marks[1]).toEqual({ type: I.MarkType.Color, range: { from: 0, to: 21 }, param: 'red' });
		});

		it('should handle a mixed paste with headings, lists, and formatted text', () => {
			const blocks = [
				{
					id: 'h1',
					type: 'text',
					bgColor: '',
					content: { text: 'My Heading', style: I.TextStyle.Header1, marks: [], color: '' },
				},
				{
					id: 'p1',
					type: 'text',
					bgColor: 'yellow',
					content: {
						text: 'Some highlighted text with a link',
						style: I.TextStyle.Paragraph,
						marks: [
							{ type: I.MarkType.Link, range: { from: 27, to: 31 }, param: 'https://example.com' },
						],
						color: '',
					},
				},
				{
					id: 'li1',
					type: 'text',
					bgColor: '',
					content: { text: 'List item 1', style: I.TextStyle.Bulleted, marks: [], color: '' },
				},
				{
					id: 'li2',
					type: 'text',
					bgColor: '',
					content: {
						text: 'List item 2 bold',
						style: I.TextStyle.Bulleted,
						marks: [{ type: I.MarkType.Bold, range: { from: 12, to: 16 }, param: '' }],
						color: '',
					},
				},
			];
			const parts = clipboardBlocksToParts(blocks);

			expect(parts).toHaveLength(4);

			// Heading
			expect(parts[0].style).toBe(I.TextStyle.Header1);
			expect(parts[0].text).toBe('My Heading');
			expect(parts[0].marks).toEqual([]);

			// Highlighted paragraph with link
			expect(parts[1].style).toBe(I.TextStyle.Paragraph);
			expect(parts[1].marks).toHaveLength(2); // link + bgColor
			expect(parts[1].marks[0].type).toBe(I.MarkType.Link);
			expect(parts[1].marks[1].type).toBe(I.MarkType.BgColor);
			expect(parts[1].marks[1].param).toBe('yellow');

			// List items
			expect(parts[2].style).toBe(I.TextStyle.Bulleted);
			expect(parts[3].style).toBe(I.TextStyle.Bulleted);
			expect(parts[3].marks[0].type).toBe(I.MarkType.Bold);
		});

		it('should filter out empty text blocks from mixed content', () => {
			// Matches real clipboard data: text blocks with empty text interspersed
			const blocks = [
				{ id: '1', type: 'text', bgColor: '', content: { text: 'sadasdasd', style: 0, color: 'red', marks: [] } },
				{ id: '2', type: 'file', bgColor: '', content: { targetObjectId: '', type: 2 } },
				{ id: '3', type: 'text', bgColor: '', content: { text: '', style: 0, color: '', marks: [] } },
				{ id: '4', type: 'text', bgColor: '', content: { text: 'asdasda', style: 0, color: 'pink', marks: [] } },
				{ id: '5', type: 'text', bgColor: '', content: { text: 'asdasd', style: 0, color: 'yellow', marks: [] } },
				{ id: '6', type: 'text', bgColor: '', content: { text: 'dasdasd', style: 0, color: 'purple', marks: [] } },
				{ id: '7', type: 'text', bgColor: '', content: { text: '', style: 0, color: '', marks: [] } },
				{ id: '8', type: 'text', bgColor: '', content: { text: '', style: 0, color: '', marks: [] } },
			];
			const parts = clipboardBlocksToParts(blocks);

			// Only non-empty text blocks should remain (blocks 1, 4, 5, 6)
			expect(parts).toHaveLength(4);
			expect(parts[0].text).toBe('sadasdasd');
			expect(parts[1].text).toBe('asdasda');
			expect(parts[2].text).toBe('asdasd');
			expect(parts[3].text).toBe('dasdasd');

			// Colors should be converted to marks
			expect(parts[0].marks[0]).toEqual({ type: I.MarkType.Color, param: 'red', range: { from: 0, to: 9 } });
			expect(parts[1].marks[0]).toEqual({ type: I.MarkType.Color, param: 'pink', range: { from: 0, to: 7 } });
			expect(parts[2].marks[0]).toEqual({ type: I.MarkType.Color, param: 'yellow', range: { from: 0, to: 6 } });
			expect(parts[3].marks[0]).toEqual({ type: I.MarkType.Color, param: 'purple', range: { from: 0, to: 7 } });
		});

		it('should handle blocks with only color, no text marks (common scenario)', () => {
			// User copies a block that has block-level color but no inline marks
			const blocks = [
				{
					id: 'block-1',
					type: 'text',
					bgColor: '',
					content: {
						text: 'Just colored text',
						style: 0,
						marks: [],
						color: 'red',
					},
				},
			];
			const parts = clipboardBlocksToParts(blocks);

			expect(parts).toHaveLength(1);
			expect(parts[0].marks).toHaveLength(1);
			expect(parts[0].marks[0]).toEqual({
				type: I.MarkType.Color,
				param: 'red',
				range: { from: 0, to: 17 },
			});
		});
	});

	describe('round-trip: clipboardBlocksToParts -> partsToChatBlocks', () => {
		// Import Comment utility for round-trip testing
		let Comment: any;

		// Dynamic import to avoid circular dependency issues
		beforeAll(async () => {
			Comment = (await import('./comment')).default;
		});

		it('should preserve text and marks through round-trip (without color)', () => {
			const blocks = [
				{
					type: 'text',
					content: {
						text: 'bold and italic text',
						style: I.TextStyle.Paragraph,
						marks: [
							{ type: I.MarkType.Bold, range: { from: 0, to: 4 }, param: '' },
							{ type: I.MarkType.Italic, range: { from: 9, to: 15 }, param: '' },
						],
					},
				},
			];

			const parts = clipboardBlocksToParts(blocks);
			const chatBlocks = Comment.partsToChatBlocks(parts);

			expect(chatBlocks).toHaveLength(1);
			expect(chatBlocks[0].text.text).toBe('bold and italic text');
			expect(chatBlocks[0].text.marks).toHaveLength(2);
			expect(chatBlocks[0].text.marks[0].type).toBe(I.MarkType.Bold);
			expect(chatBlocks[0].text.marks[1].type).toBe(I.MarkType.Italic);
		});

		it('should preserve heading style through round-trip', () => {
			const blocks = [
				{
					type: 'text',
					content: { text: 'Heading', style: I.TextStyle.Header1, marks: [] },
				},
			];

			const parts = clipboardBlocksToParts(blocks);
			const chatBlocks = Comment.partsToChatBlocks(parts);

			expect(chatBlocks[0].text.style).toBe(I.TextStyle.Header1);
		});

		it('should include color marks in round-trip output', () => {
			const blocks = [
				{
					type: 'text',
					bgColor: 'yellow',
					content: { text: 'colored', style: 0, marks: [], color: 'red' },
				},
			];

			const parts = clipboardBlocksToParts(blocks);
			const chatBlocks = Comment.partsToChatBlocks(parts);

			expect(chatBlocks[0].text.marks).toHaveLength(2);
			const colorMark = chatBlocks[0].text.marks.find((m: any) => m.type === I.MarkType.Color);
			const bgColorMark = chatBlocks[0].text.marks.find((m: any) => m.type === I.MarkType.BgColor);

			expect(colorMark).toBeDefined();
			expect(colorMark.param).toBe('red');
			expect(bgColorMark).toBeDefined();
			expect(bgColorMark.param).toBe('yellow');
		});
	});
});
