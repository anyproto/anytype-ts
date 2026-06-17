import { describe, it, expect } from 'vitest';
import Chat from './chat';
import * as I from 'Interface';

const F = '```';

describe('Chat', () => {

	describe('fenceToBlocks', () => {
		it('returns hasCode=false and no blocks for plain text', () => {
			const res = Chat.fenceToBlocks('hello world', []);
			expect(res.hasCode).toBe(false);
			expect(res.blocks).toHaveLength(0);
		});

		it('parses a single code block with language', () => {
			const text = [ `${F}ts`, 'const x = 1;', 'foo(x);', F ].join('\n');
			const res = Chat.fenceToBlocks(text, []);

			expect(res.hasCode).toBe(true);
			expect(res.blocks).toHaveLength(1);
			expect(res.blocks[0].text.style).toBe(I.TextStyle.Code);
			expect(res.blocks[0].text.lang).toBe('ts');
			expect(res.blocks[0].text.text).toBe('const x = 1;\nfoo(x);');
			expect(res.blocks[0].text.marks).toHaveLength(0);
		});

		it('parses mixed text + code + text in order', () => {
			const text = [ 'Hey, try this:', `${F}js`, 'foo(bar)', F, 'let me know!' ].join('\n');
			const res = Chat.fenceToBlocks(text, []);

			expect(res.blocks).toHaveLength(3);
			expect(res.blocks[0].text.style).toBe(I.TextStyle.Paragraph);
			expect(res.blocks[0].text.text).toBe('Hey, try this:');
			expect(res.blocks[1].text.style).toBe(I.TextStyle.Code);
			expect(res.blocks[1].text.text).toBe('foo(bar)');
			expect(res.blocks[2].text.style).toBe(I.TextStyle.Paragraph);
			expect(res.blocks[2].text.text).toBe('let me know!');
		});

		it('treats an unclosed fence as code to end of message', () => {
			const text = [ 'before', `${F}`, 'a', 'b' ].join('\n');
			const res = Chat.fenceToBlocks(text, []);

			expect(res.blocks).toHaveLength(2);
			expect(res.blocks[1].text.style).toBe(I.TextStyle.Code);
			expect(res.blocks[1].text.text).toBe('a\nb');
			expect(res.blocks[1].text.lang).toBeUndefined();
		});

		it('slices and re-offsets marks into the correct paragraph block', () => {
			const text = [ 'Hi', `${F}`, 'x', F, 'bye' ].join('\n');
			const byeFrom = text.indexOf('bye');
			const marks: I.Mark[] = [
				{ type: I.MarkType.Bold, range: { from: 0, to: 2 } },
				{ type: I.MarkType.Italic, range: { from: byeFrom, to: byeFrom + 3 } },
			];
			const res = Chat.fenceToBlocks(text, marks);

			expect(res.blocks[0].text.text).toBe('Hi');
			expect(res.blocks[0].text.marks).toEqual([{ type: I.MarkType.Bold, range: { from: 0, to: 2 } }]);
			expect(res.blocks[2].text.text).toBe('bye');
			expect(res.blocks[2].text.marks).toEqual([{ type: I.MarkType.Italic, range: { from: 0, to: 3 } }]);
		});

		it('drops marks that fall inside a code block', () => {
			const text = [ `${F}`, 'secret', F ].join('\n');
			const codeFrom = text.indexOf('secret');
			const marks: I.Mark[] = [{ type: I.MarkType.Bold, range: { from: codeFrom, to: codeFrom + 6 } }];
			const res = Chat.fenceToBlocks(text, marks);

			expect(res.blocks).toHaveLength(1);
			expect(res.blocks[0].text.style).toBe(I.TextStyle.Code);
			expect(res.blocks[0].text.marks).toHaveLength(0);
		});

		it('omits empty paragraph segments around fences', () => {
			const text = [ `${F}`, 'code', F ].join('\n');
			const res = Chat.fenceToBlocks(text, []);
			expect(res.blocks).toHaveLength(1);
			expect(res.blocks[0].text.style).toBe(I.TextStyle.Code);
		});
	});

	describe('isInOpenCodeFence', () => {
		it('is false in plain text', () => {
			expect(Chat.isInOpenCodeFence('hello', 3)).toBe(false);
		});

		it('is true on an opening fence line', () => {
			const text = `${F}ts`;
			expect(Chat.isInOpenCodeFence(text, text.length)).toBe(true);
		});

		it('is true inside an open code body', () => {
			const text = [ `${F}ts`, 'co' ].join('\n');
			expect(Chat.isInOpenCodeFence(text, text.length)).toBe(true);
		});

		it('is false right after a closing fence', () => {
			const text = [ `${F}ts`, 'code', F ].join('\n');
			expect(Chat.isInOpenCodeFence(text, text.length)).toBe(false);
		});

		it('is false in trailing text after a closed block', () => {
			const text = [ `${F}`, 'code', F, 'after' ].join('\n');
			expect(Chat.isInOpenCodeFence(text, text.length)).toBe(false);
		});
	});
});
