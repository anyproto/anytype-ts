import { describe, it, expect } from 'vitest';
import Mark from './mark';
import * as I from 'Interface';

describe('Mark', () => {

	describe('overlap', () => {
		it('should detect Equal overlap', () => {
			expect(Mark.overlap({ from: 5, to: 10 }, { from: 5, to: 10 })).toBe(I.MarkOverlap.Equal);
		});

		it('should detect Before overlap', () => {
			expect(Mark.overlap({ from: 0, to: 3 }, { from: 5, to: 10 })).toBe(I.MarkOverlap.Before);
		});

		it('should detect After overlap', () => {
			expect(Mark.overlap({ from: 12, to: 15 }, { from: 5, to: 10 })).toBe(I.MarkOverlap.After);
		});

		it('should detect Outer overlap', () => {
			expect(Mark.overlap({ from: 3, to: 12 }, { from: 5, to: 10 })).toBe(I.MarkOverlap.Outer);
		});

		it('should detect Inner overlap', () => {
			expect(Mark.overlap({ from: 6, to: 9 }, { from: 5, to: 10 })).toBe(I.MarkOverlap.Inner);
		});

		it('should detect InnerLeft overlap', () => {
			expect(Mark.overlap({ from: 5, to: 8 }, { from: 5, to: 10 })).toBe(I.MarkOverlap.InnerLeft);
		});

		it('should detect InnerRight overlap', () => {
			expect(Mark.overlap({ from: 7, to: 10 }, { from: 5, to: 10 })).toBe(I.MarkOverlap.InnerRight);
		});

		it('should detect Left overlap', () => {
			expect(Mark.overlap({ from: 3, to: 7 }, { from: 5, to: 10 })).toBe(I.MarkOverlap.Left);
		});

		it('should detect Right overlap', () => {
			expect(Mark.overlap({ from: 8, to: 12 }, { from: 5, to: 10 })).toBe(I.MarkOverlap.Right);
		});
	});

	describe('sort', () => {
		it('should sort marks by type priority', () => {
			const marks: I.Mark[] = [
				{ type: I.MarkType.Bold, range: { from: 0, to: 5 }, param: '' },
				{ type: I.MarkType.Italic, range: { from: 0, to: 5 }, param: '' },
			];

			const sorted = marks.sort(Mark.sort);

			// Italic has lower order index than Bold
			expect(sorted[0].type).toBe(I.MarkType.Italic);
			expect(sorted[1].type).toBe(I.MarkType.Bold);
		});

		it('should sort by range.from when same type', () => {
			const marks: I.Mark[] = [
				{ type: I.MarkType.Bold, range: { from: 5, to: 10 }, param: '' },
				{ type: I.MarkType.Bold, range: { from: 0, to: 5 }, param: '' },
			];

			const sorted = marks.sort(Mark.sort);

			expect(sorted[0].range.from).toBe(0);
			expect(sorted[1].range.from).toBe(5);
		});
	});

	describe('adjust', () => {
		it('should shift marks after insertion point', () => {
			const marks: I.Mark[] = [
				{ type: I.MarkType.Bold, range: { from: 10, to: 20 }, param: '' },
			];

			const adjusted = Mark.adjust(marks, 5, 3);

			expect(adjusted[0].range.from).toBe(13);
			expect(adjusted[0].range.to).toBe(23);
		});

		it('should expand marks spanning the insertion point', () => {
			const marks: I.Mark[] = [
				{ type: I.MarkType.Bold, range: { from: 5, to: 15 }, param: '' },
			];

			const adjusted = Mark.adjust(marks, 10, 3);

			expect(adjusted[0].range.from).toBe(5);
			expect(adjusted[0].range.to).toBe(18);
		});

		it('should not shift marks before insertion point', () => {
			const marks: I.Mark[] = [
				{ type: I.MarkType.Bold, range: { from: 0, to: 5 }, param: '' },
			];

			const adjusted = Mark.adjust(marks, 10, 3);

			expect(adjusted[0].range.from).toBe(0);
			expect(adjusted[0].range.to).toBe(5);
		});

		it('should handle negative length (deletion)', () => {
			const marks: I.Mark[] = [
				{ type: I.MarkType.Bold, range: { from: 10, to: 20 }, param: '' },
			];

			const adjusted = Mark.adjust(marks, 5, -3);

			expect(adjusted[0].range.from).toBe(7);
			expect(adjusted[0].range.to).toBe(17);
		});

		it('should clamp from to 0', () => {
			const marks: I.Mark[] = [
				{ type: I.MarkType.Bold, range: { from: 2, to: 10 }, param: '' },
			];

			const adjusted = Mark.adjust(marks, 0, -5);

			expect(adjusted[0].range.from).toBe(0);
		});
	});

	describe('checkRanges', () => {
		it('should remove marks with from >= text length', () => {
			const marks: I.Mark[] = [
				{ type: I.MarkType.Bold, range: { from: 10, to: 15 }, param: '' },
			];

			const result = Mark.checkRanges('hello', marks);

			expect(result).toHaveLength(0);
		});

		it('should remove zero-length marks', () => {
			const marks: I.Mark[] = [
				{ type: I.MarkType.Bold, range: { from: 3, to: 3 }, param: '' },
			];

			const result = Mark.checkRanges('hello world', marks);

			expect(result).toHaveLength(0);
		});

		it('should clamp to to text length', () => {
			const marks: I.Mark[] = [
				{ type: I.MarkType.Bold, range: { from: 3, to: 100 }, param: '' },
			];

			const result = Mark.checkRanges('hello', marks);

			expect(result[0].range.to).toBe(5);
		});

		it('should merge adjacent marks of same type and param', () => {
			const marks: I.Mark[] = [
				{ type: I.MarkType.Bold, range: { from: 0, to: 5 }, param: '' },
				{ type: I.MarkType.Bold, range: { from: 5, to: 10 }, param: '' },
			];

			const result = Mark.checkRanges('hello world', marks);

			expect(result).toHaveLength(1);
			expect(result[0].range.from).toBe(0);
			expect(result[0].range.to).toBe(10);
		});

		it('should remove marks with negative ranges', () => {
			const marks: I.Mark[] = [
				{ type: I.MarkType.Bold, range: { from: -1, to: 5 }, param: '' },
			];

			const result = Mark.checkRanges('hello world', marks);

			expect(result).toHaveLength(0);
		});
	});

	describe('toggle', () => {
		it('should add a new mark to empty list', () => {
			const result = Mark.toggle([], {
				type: I.MarkType.Bold,
				range: { from: 0, to: 5 },
				param: '',
			});

			expect(result).toHaveLength(1);
			expect(result[0].type).toBe(I.MarkType.Bold);
		});

		it('should remove an equal mark without param', () => {
			const marks: I.Mark[] = [
				{ type: I.MarkType.Bold, range: { from: 0, to: 5 }, param: '' },
			];

			const result = Mark.toggle(marks, {
				type: I.MarkType.Bold,
				range: { from: 0, to: 5 },
				param: '',
			});

			expect(result).toHaveLength(0);
		});

		it('should not toggle mark with zero range', () => {
			const result = Mark.toggle([], {
				type: I.MarkType.Bold,
				range: { from: 5, to: 5 },
				param: '',
			});

			expect(result).toHaveLength(0);
		});

		it('should remove contained mark and add new one (Outer overlap)', () => {
			const marks: I.Mark[] = [
				{ type: I.MarkType.Bold, range: { from: 3, to: 7 }, param: '' },
			];

			const result = Mark.toggle(marks, {
				type: I.MarkType.Bold,
				range: { from: 0, to: 10 },
				param: '',
			});

			expect(result).toHaveLength(1);
			expect(result[0].range.from).toBe(0);
			expect(result[0].range.to).toBe(10);
		});

		it('should update param on Equal overlap with param', () => {
			const marks: I.Mark[] = [
				{ type: I.MarkType.Color, range: { from: 0, to: 5 }, param: 'red' },
			];

			const result = Mark.toggle(marks, {
				type: I.MarkType.Color,
				range: { from: 0, to: 5 },
				param: 'blue',
			});

			expect(result).toHaveLength(1);
			expect(result[0].param).toBe('blue');
		});

		it('should handle InnerLeft overlap without param', () => {
			const marks: I.Mark[] = [
				{ type: I.MarkType.Bold, range: { from: 0, to: 10 }, param: '' },
			];

			const result = Mark.toggle(marks, {
				type: I.MarkType.Bold,
				range: { from: 0, to: 5 },
				param: '',
			});

			// Should shrink existing mark to 5-10
			expect(result).toHaveLength(1);
			expect(result[0].range.from).toBe(5);
			expect(result[0].range.to).toBe(10);
		});

		it('should handle InnerRight overlap without param', () => {
			const marks: I.Mark[] = [
				{ type: I.MarkType.Bold, range: { from: 0, to: 10 }, param: '' },
			];

			const result = Mark.toggle(marks, {
				type: I.MarkType.Bold,
				range: { from: 5, to: 10 },
				param: '',
			});

			// Should shrink existing mark to 0-5
			expect(result).toHaveLength(1);
			expect(result[0].range.from).toBe(0);
			expect(result[0].range.to).toBe(5);
		});

		it('should not add mark with null type', () => {
			const result = Mark.toggle([], {
				type: null as any,
				range: { from: 0, to: 5 },
				param: '',
			});

			expect(result).toHaveLength(0);
		});

		it('should handle different mark types independently', () => {
			const marks: I.Mark[] = [
				{ type: I.MarkType.Bold, range: { from: 0, to: 5 }, param: '' },
			];

			const result = Mark.toggle(marks, {
				type: I.MarkType.Italic,
				range: { from: 0, to: 5 },
				param: '',
			});

			expect(result).toHaveLength(2);
		});
	});

	describe('trimRange', () => {
		it('should trim trailing spaces from range', () => {
			const result = Mark.trimRange('hello   ', { from: 0, to: 8 });

			expect(result.from).toBe(0);
			expect(result.to).toBe(5);
		});

		it('should not trim if no trailing spaces', () => {
			const result = Mark.trimRange('hello', { from: 0, to: 5 });

			expect(result.to).toBe(5);
		});
	});

	describe('getTag', () => {
		it('should return "a" for Link type', () => {
			expect(Mark.getTag(I.MarkType.Link)).toBe('a');
		});

		it('should return markup tag for other types', () => {
			expect(Mark.getTag(I.MarkType.Bold)).toBe('markupbold');
			expect(Mark.getTag(I.MarkType.Italic)).toBe('markupitalic');
			expect(Mark.getTag(I.MarkType.Code)).toBe('markupcode');
		});
	});

	describe('needsBreak', () => {
		it('should return true for Link type', () => {
			expect(Mark.needsBreak(I.MarkType.Link)).toBe(true);
		});

		it('should return false for Bold type', () => {
			expect(Mark.needsBreak(I.MarkType.Bold)).toBe(false);
		});
	});

	describe('canSave', () => {
		it('should return true for Bold', () => {
			expect(Mark.canSave(I.MarkType.Bold)).toBe(true);
		});

		it('should return false for Search', () => {
			expect(Mark.canSave(I.MarkType.Search)).toBe(false);
		});

		it('should return false for Change', () => {
			expect(Mark.canSave(I.MarkType.Change)).toBe(false);
		});
	});

	describe('getInRange', () => {
		it('should find a mark of type overlapping range', () => {
			const marks: I.Mark[] = [
				{ type: I.MarkType.Bold, range: { from: 0, to: 10 }, param: '' },
			];

			const result = Mark.getInRange(marks, I.MarkType.Bold, { from: 3, to: 7 });

			expect(result).not.toBeNull();
			expect(result!.type).toBe(I.MarkType.Bold);
		});

		it('should return null when no mark of type exists', () => {
			const marks: I.Mark[] = [
				{ type: I.MarkType.Bold, range: { from: 0, to: 10 }, param: '' },
			];

			const result = Mark.getInRange(marks, I.MarkType.Italic, { from: 3, to: 7 });

			expect(result).toBeNull();
		});

		it('should return null for null range', () => {
			expect(Mark.getInRange([], I.MarkType.Bold, null as any)).toBeNull();
		});

		it('should return null for empty marks', () => {
			expect(Mark.getInRange([], I.MarkType.Bold, { from: 0, to: 5 })).toBeNull();
		});
	});

	describe('getPartOfString', () => {
		it('should extract text and marks within range', () => {
			const marks: I.Mark[] = [
				{ type: I.MarkType.Bold, range: { from: 2, to: 8 }, param: '' },
			];

			const result = Mark.getPartOfString('hello world', { from: 2, to: 8 }, marks);

			expect(result.text).toBe('llo wo');
			expect(result.marks).toHaveLength(1);
			expect(result.marks[0].range.from).toBe(0);
			expect(result.marks[0].range.to).toBe(6);
		});

		it('should handle marks partially overlapping the range', () => {
			const marks: I.Mark[] = [
				{ type: I.MarkType.Bold, range: { from: 0, to: 10 }, param: '' },
			];

			const result = Mark.getPartOfString('hello world', { from: 3, to: 8 }, marks);

			expect(result.text).toBe('lo wo');
			expect(result.marks).toHaveLength(1);
		});

		it('should return empty marks when none overlap', () => {
			const marks: I.Mark[] = [
				{ type: I.MarkType.Bold, range: { from: 0, to: 3 }, param: '' },
			];

			const result = Mark.getPartOfString('hello world', { from: 5, to: 11 }, marks);

			expect(result.text).toBe(' world');
			expect(result.marks).toHaveLength(0);
		});
	});

	describe('paramToAttr', () => {
		it('should generate href for Link type', () => {
			const attr = Mark.paramToAttr(I.MarkType.Link, 'https://example.com');

			expect(attr).toContain('href=');
			expect(attr).toContain('markuplink');
		});

		it('should generate color class for Color type', () => {
			const attr = Mark.paramToAttr(I.MarkType.Color, 'red');

			expect(attr).toContain('textColor-red');
		});

		it('should generate bgColor class for BgColor type', () => {
			const attr = Mark.paramToAttr(I.MarkType.BgColor, 'yellow');

			expect(attr).toContain('bgColor-yellow');
		});

		it('should generate contenteditable for Mention type', () => {
			const attr = Mark.paramToAttr(I.MarkType.Mention, 'user123');

			expect(attr).toContain('contenteditable="false"');
		});

		it('should generate spellcheck for Code type', () => {
			const attr = Mark.paramToAttr(I.MarkType.Code, '');

			expect(attr).toContain('spellcheck="false"');
		});
	});

});
