import { describe, it, expect } from 'vitest';
import Block from './block';
import * as I from 'Interface';

const makeBlock = (overrides: Partial<I.Block> = {}): Block => {
	return new Block({
		id: 'test-block',
		parentId: '',
		type: I.BlockType.Text,
		childrenIds: [],
		hAlign: I.BlockHAlign.Left,
		vAlign: I.BlockVAlign.Top,
		bgColor: '',
		fields: {},
		content: { style: I.TextStyle.Paragraph },
		layout: I.ObjectLayout.Page,
		...overrides,
	} as I.Block);
};

describe('Block', () => {

	describe('constructor', () => {
		it('should set id and type', () => {
			const block = makeBlock({ id: 'my-block', type: I.BlockType.Text });

			expect(block.id).toBe('my-block');
			expect(block.type).toBe(I.BlockType.Text);
		});

		it('should set default values', () => {
			const block = makeBlock();

			expect(block.hAlign).toBe(I.BlockHAlign.Left);
			expect(block.vAlign).toBe(I.BlockVAlign.Top);
			expect(block.bgColor).toBe('');
		});

		it('should set childrenIds', () => {
			const block = makeBlock({ childrenIds: ['a', 'b', 'c'] });

			expect(block.childrenIds).toEqual(['a', 'b', 'c']);
		});
	});

	describe('type checks', () => {
		it('isPage should return true for Page type', () => {
			const block = makeBlock({ type: I.BlockType.Page });

			expect(block.isPage()).toBe(true);
			expect(block.isText()).toBe(false);
		});

		it('isText should return true for Text type', () => {
			const block = makeBlock({ type: I.BlockType.Text });

			expect(block.isText()).toBe(true);
		});

		it('isLayout should return true for Layout type', () => {
			const block = makeBlock({ type: I.BlockType.Layout });

			expect(block.isLayout()).toBe(true);
		});

		it('isFile should return true for File type', () => {
			const block = makeBlock({ type: I.BlockType.File });

			expect(block.isFile()).toBe(true);
		});

		it('isLink should return true for Link type', () => {
			const block = makeBlock({ type: I.BlockType.Link });

			expect(block.isLink()).toBe(true);
		});

		it('isBookmark should return true for Bookmark type', () => {
			const block = makeBlock({ type: I.BlockType.Bookmark });

			expect(block.isBookmark()).toBe(true);
		});

		it('isDiv should return true for Div type', () => {
			const block = makeBlock({ type: I.BlockType.Div });

			expect(block.isDiv()).toBe(true);
		});

		it('isTable should return true for Table type', () => {
			const block = makeBlock({ type: I.BlockType.Table });

			expect(block.isTable()).toBe(true);
		});

		it('isDataview should return true for Dataview type', () => {
			const block = makeBlock({ type: I.BlockType.Dataview });

			expect(block.isDataview()).toBe(true);
		});

		it('isWidget should return true for Widget type', () => {
			const block = makeBlock({ type: I.BlockType.Widget });

			expect(block.isWidget()).toBe(true);
		});
	});

	describe('text style checks', () => {
		it('isTextParagraph should return true for Paragraph style', () => {
			const block = makeBlock({ type: I.BlockType.Text, content: { style: I.TextStyle.Paragraph } });

			expect(block.isTextParagraph()).toBe(true);
		});

		it('isTextHeader should return true for Header styles', () => {
			expect(makeBlock({ type: I.BlockType.Text, content: { style: I.TextStyle.Header1 } }).isTextHeader()).toBe(true);
			expect(makeBlock({ type: I.BlockType.Text, content: { style: I.TextStyle.Header2 } }).isTextHeader()).toBe(true);
			expect(makeBlock({ type: I.BlockType.Text, content: { style: I.TextStyle.Header3 } }).isTextHeader()).toBe(true);
		});

		it('isTextCode should return true for Code style', () => {
			const block = makeBlock({ type: I.BlockType.Text, content: { style: I.TextStyle.Code } });

			expect(block.isTextCode()).toBe(true);
		});

		it('isTextTitle should return true for Title style', () => {
			const block = makeBlock({ type: I.BlockType.Text, content: { style: I.TextStyle.Title } });

			expect(block.isTextTitle()).toBe(true);
		});

		it('isTextDescription should return true for Description style', () => {
			const block = makeBlock({ type: I.BlockType.Text, content: { style: I.TextStyle.Description } });

			expect(block.isTextDescription()).toBe(true);
		});

		it('isTextQuote should return true for Quote style', () => {
			const block = makeBlock({ type: I.BlockType.Text, content: { style: I.TextStyle.Quote } });

			expect(block.isTextQuote()).toBe(true);
		});

		it('isTextCallout should return true for Callout style', () => {
			const block = makeBlock({ type: I.BlockType.Text, content: { style: I.TextStyle.Callout } });

			expect(block.isTextCallout()).toBe(true);
		});

		it('isTextToggle should return true for Toggle style', () => {
			const block = makeBlock({ type: I.BlockType.Text, content: { style: I.TextStyle.Toggle } });

			expect(block.isTextToggle()).toBe(true);
		});
	});

	describe('system checks', () => {
		it('isSystem should return true for Page or Layout', () => {
			expect(makeBlock({ type: I.BlockType.Page }).isSystem()).toBe(true);
			expect(makeBlock({ type: I.BlockType.Layout }).isSystem()).toBe(true);
		});

		it('isSystem should return false for text blocks', () => {
			expect(makeBlock({ type: I.BlockType.Text }).isSystem()).toBe(false);
		});
	});

	describe('capability methods', () => {
		it('canHaveChildren should be true for paragraph', () => {
			const block = makeBlock({ type: I.BlockType.Text, content: { style: I.TextStyle.Paragraph } });

			expect(block.canHaveChildren()).toBe(true);
		});

		it('canHaveChildren should be false for system blocks', () => {
			const block = makeBlock({ type: I.BlockType.Page });

			expect(block.canHaveChildren()).toBe(false);
		});

		it('canHaveMarks should be true for paragraph text', () => {
			const block = makeBlock({ type: I.BlockType.Text, content: { style: I.TextStyle.Paragraph } });

			expect(block.canHaveMarks()).toBe(true);
		});

		it('canHaveMarks should be false for code blocks', () => {
			const block = makeBlock({ type: I.BlockType.Text, content: { style: I.TextStyle.Code } });

			expect(block.canHaveMarks()).toBe(false);
		});

		it('canHaveMarks should be false for title blocks', () => {
			const block = makeBlock({ type: I.BlockType.Text, content: { style: I.TextStyle.Title } });

			expect(block.canHaveMarks()).toBe(false);
		});

		it('canTurn should be true for regular text', () => {
			const block = makeBlock({ type: I.BlockType.Text, content: { style: I.TextStyle.Paragraph } });

			expect(block.canTurn()).toBe(true);
		});

		it('canTurn should be false for title', () => {
			const block = makeBlock({ type: I.BlockType.Text, content: { style: I.TextStyle.Title } });

			expect(block.canTurn()).toBe(false);
		});
	});

	describe('isLocked', () => {
		it('should return true when locked', () => {
			const block = makeBlock({ fields: { isLocked: true } });

			expect(block.isLocked()).toBe(true);
		});

		it('should return falsy when not locked', () => {
			const block = makeBlock({ fields: {} });

			expect(block.isLocked()).toBeFalsy();
		});
	});

	describe('file type checks', () => {
		it('isFileImage should return true for image files', () => {
			const block = makeBlock({
				type: I.BlockType.File,
				content: { type: I.FileType.Image, style: I.FileStyle.Auto, state: I.FileState.Done },
			});

			expect(block.isFileImage()).toBe(true);
		});

		it('isFileVideo should return true for video files', () => {
			const block = makeBlock({
				type: I.BlockType.File,
				content: { type: I.FileType.Video, style: I.FileStyle.Auto, state: I.FileState.Done },
			});

			expect(block.isFileVideo()).toBe(true);
		});

		it('isFileAudio should return true for audio files', () => {
			const block = makeBlock({
				type: I.BlockType.File,
				content: { type: I.FileType.Audio, style: I.FileStyle.Auto, state: I.FileState.Done },
			});

			expect(block.isFileAudio()).toBe(true);
		});
	});

});
