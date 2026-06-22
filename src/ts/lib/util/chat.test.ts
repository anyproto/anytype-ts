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

		it('clamps a mark straddling the paragraph/code boundary to the paragraph length', () => {
			const text = [ 'Hi', `${F}`, 'x', F, 'bye' ].join('\n');
			// Bold starts at "Hi" (0) and runs into the code region (to: 8) — must be clamped to "Hi" (0..2).
			const marks: I.Mark[] = [{ type: I.MarkType.Bold, range: { from: 0, to: 8 } }];
			const res = Chat.fenceToBlocks(text, marks);

			expect(res.blocks[0].text.text).toBe('Hi');
			expect(res.blocks[0].text.marks).toEqual([{ type: I.MarkType.Bold, range: { from: 0, to: 2 } }]);
		});

		it('does not emit a code block for a lone/stray opening fence', () => {
			for (const text of [ `${F}`, `${F}ts`, [ `${F}`, F ].join('\n') ]) {
				const res = Chat.fenceToBlocks(text, []);
				expect(res.hasCode).toBe(false);
				expect(res.blocks).toHaveLength(0);
			};
		});

		it('omits a whitespace-only paragraph between two code blocks', () => {
			const text = [ `${F}`, 'c', F, '   ', `${F}`, 'd', F ].join('\n');
			const res = Chat.fenceToBlocks(text, []);

			expect(res.blocks).toHaveLength(2);
			expect(res.blocks[0].text.style).toBe(I.TextStyle.Code);
			expect(res.blocks[1].text.style).toBe(I.TextStyle.Code);
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

	describe('blocksToFence', () => {
		it('rebuilds a code block with a language', () => {
			const blocks: I.ChatMessageBlock[] = [
				{ text: { text: 'const x = 1;', style: I.TextStyle.Code, marks: [], lang: 'ts' } },
			];
			const res = Chat.blocksToFence(blocks);
			expect(res.text).toBe([ `${F}ts`, 'const x = 1;', F ].join('\n'));
		});

		it('rebuilds a no-language code block', () => {
			const blocks: I.ChatMessageBlock[] = [
				{ text: { text: 'foo', style: I.TextStyle.Code, marks: [] } },
			];
			const res = Chat.blocksToFence(blocks);
			expect(res.text).toBe([ `${F}`, 'foo', F ].join('\n'));
		});

		it('round-trips fenceToBlocks -> blocksToFence for mixed content', () => {
			const text = [ 'Hey', `${F}js`, 'foo(bar)', F, 'bye' ].join('\n');
			const byeFrom = text.indexOf('bye');
			const marks: I.Mark[] = [
				{ type: I.MarkType.Bold, range: { from: 0, to: 3 } },           // "Hey"
				{ type: I.MarkType.Italic, range: { from: byeFrom, to: byeFrom + 3 } }, // "bye"
			];

			const { blocks } = Chat.fenceToBlocks(text, marks);
			const back = Chat.blocksToFence(blocks);

			expect(back.text).toBe(text);
			// marks re-offset back to global positions, code-region marks dropped (order-independent)
			expect(back.marks).toHaveLength(2);
			expect(back.marks).toContainEqual({ type: I.MarkType.Bold, range: { from: 0, to: 3 } });
			expect(back.marks).toContainEqual({ type: I.MarkType.Italic, range: { from: byeFrom, to: byeFrom + 3 } });
		});

		it('ignores non-text blocks', () => {
			const blocks: any[] = [ { link: { targetObjectId: 'x', type: 0 } } ];
			expect(Chat.blocksToFence(blocks).text).toBe('');
		});
	});

	describe('blocksToText', () => {
		it('emits fence-less plain text for content.text (no ``` markers)', () => {
			const { blocks } = Chat.fenceToBlocks([ 'Hey', `${F}js`, 'foo(bar)', F, 'bye' ].join('\n'), []);
			const plain = Chat.blocksToText(blocks);
			expect(plain.text).toBe('Hey\nfoo(bar)\nbye');
		});

		it('re-offsets paragraph marks and drops code marks', () => {
			const text = [ `${F}`, 'x', F, 'bold' ].join('\n');
			const boldFrom = text.indexOf('bold');
			const { blocks } = Chat.fenceToBlocks(text, [ { type: I.MarkType.Bold, range: { from: boldFrom, to: boldFrom + 4 } } ]);
			const plain = Chat.blocksToText(blocks);
			// "x\nbold" — code "x" then paragraph "bold"; Bold re-offset onto the plain text
			expect(plain.text).toBe('x\nbold');
			expect(plain.marks).toContainEqual({ type: I.MarkType.Bold, range: { from: 2, to: 6 } });
		});
	});

	describe('fenceToCodeMarks', () => {
		it('turns a fenced region into a Code mark over fence-less text', () => {
			const value = [ 'before', F, 'l1', 'l2', F, 'after' ].join('\n');
			const res = Chat.fenceToCodeMarks(value, []);

			expect(res.text).toBe('before\nl1\nl2\nafter');
			const code = res.marks.find(m => m.type == I.MarkType.Code);
			expect(code).toBeTruthy();
			expect(code!.range).toEqual({ from: 7, to: 12 }); // "l1\nl2"
		});

		it('leaves plain text untouched', () => {
			const res = Chat.fenceToCodeMarks('hello', []);
			expect(res.text).toBe('hello');
			expect(res.marks).toEqual([]);
		});

		it('re-offsets paragraph marks and marks the code region', () => {
			const value = [ F, 'code', F, 'bold' ].join('\n');
			const boldFrom = value.indexOf('bold');
			const res = Chat.fenceToCodeMarks(value, [ { type: I.MarkType.Bold, range: { from: boldFrom, to: boldFrom + 4 } } ]);

			expect(res.text).toBe('code\nbold');
			expect(res.marks).toContainEqual({ type: I.MarkType.Bold, range: { from: 5, to: 9 } });
			expect(res.marks.find(m => m.type == I.MarkType.Code)!.range).toEqual({ from: 0, to: 4 });
		});
	});

	describe('codeMarksToFence', () => {
		it('rebuilds ``` fences around a multiline Code mark', () => {
			const text = 'before\nl1\nl2\nafter';
			const marks = [ { type: I.MarkType.Code, param: '', range: { from: 7, to: 12 } } ];
			const res = Chat.codeMarksToFence(text, marks);

			expect(res.text).toBe([ 'before', F, 'l1', 'l2', F, 'after' ].join('\n'));
		});

		it('leaves a single-line (inline) Code mark as-is', () => {
			const text = 'solo';
			const marks = [ { type: I.MarkType.Code, param: '', range: { from: 0, to: 4 } } ];
			const res = Chat.codeMarksToFence(text, marks);

			expect(res.text).toBe('solo');
		});

		it('round-trips fenceToCodeMarks -> codeMarksToFence', () => {
			const value = [ 'before', F, 'l1', 'l2', F, 'after' ].join('\n');
			const coded = Chat.fenceToCodeMarks(value, []);
			const back = Chat.codeMarksToFence(coded.text, coded.marks);

			expect(back.text).toBe(value);
		});
	});

	describe('splitCodeRuns', () => {
		it('splits a multiline code mark into its own run, dropping separator newlines', () => {
			const text = [ 'aaae', '123', '456', '555', '777' ].join('\n');
			const from = text.indexOf('123');
			const codeText = '123\n456\n555';
			const runs = Chat.splitCodeRuns(text, [ { type: I.MarkType.Code, param: '', range: { from, to: from + codeText.length } } ]);

			expect(runs.map(r => ({ code: r.code, text: r.text }))).toEqual([
				{ code: false, text: 'aaae' },
				{ code: true, text: '123\n456\n555' },
				{ code: false, text: '777' },
			]);
		});

		it('returns a single text run when there is no multiline code', () => {
			expect(Chat.splitCodeRuns('hello world', [])).toEqual([ { code: false, text: 'hello world', marks: [] } ]);
		});

		it('round-trips fenceToCodeMarks -> splitCodeRuns', () => {
			const value = [ 'aaae', F, '123', '456', '555', F, '777' ].join('\n');
			const coded = Chat.fenceToCodeMarks(value, []);
			const runs = Chat.splitCodeRuns(coded.text, coded.marks);

			expect(runs.map(r => ({ code: r.code, text: r.text }))).toEqual([
				{ code: false, text: 'aaae' },
				{ code: true, text: '123\n456\n555' },
				{ code: false, text: '777' },
			]);
		});
	});

	describe('isInCode', () => {
		it('is true for a range inside a closed code block', () => {
			const text = [ 'before', F, 'http://b.com', F, 'after' ].join('\n');
			const from = text.indexOf('http://b.com');
			expect(Chat.isInCode(text, from, from + 'http://b.com'.length)).toBe(true);
		});

		it('is false for a range in plain text', () => {
			const text = [ 'see http://a.com', F, 'code', F ].join('\n');
			const from = text.indexOf('http://a.com');
			expect(Chat.isInCode(text, from, from + 'http://a.com'.length)).toBe(false);
		});

		it('is true inside an unclosed code block', () => {
			const text = [ 'intro', F, 'http://b.com', 'more' ].join('\n');
			const from = text.indexOf('http://b.com');
			expect(Chat.isInCode(text, from, from + 'http://b.com'.length)).toBe(true);
		});
	});

	describe('isInInlineCode', () => {
		it('is true between single backticks', () => {
			const text = 'see `http://x.com` end';
			expect(Chat.isInInlineCode(text, text.indexOf('http://x.com'))).toBe(true);
		});

		it('is false outside inline code', () => {
			const text = '`a` then http://y.com';
			expect(Chat.isInInlineCode(text, text.indexOf('http://y.com'))).toBe(false);
		});
	});
});
