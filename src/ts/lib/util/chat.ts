import * as I from 'Interface';
import Mark from 'Lib/mark';

const FENCE = '```';

interface Segment {
	type: 'text' | 'code';
	from: number;
	to: number;
	text: string;
	lang?: string;
};

class UtilChat {

	/** Split a message into ordered text/code segments with original char ranges. */
	getSegments (value: string): Segment[] {
		const text = String(value || '');
		const lines = text.split('\n');
		const lineStart: number[] = [];

		let acc = 0;
		for (let i = 0; i < lines.length; i++) {
			lineStart[i] = acc;
			acc += lines[i].length + 1; // + '\n'
		};

		const segments: Segment[] = [];

		let inCode = false;
		let lang = '';
		let textStart = -1;
		let textEnd = -1;
		let codeStart = -1;
		let codeEnd = -1;
		let codeOpenLine = -1;

		const flushText = () => {
			if (textStart < 0) {
				return;
			};

			const from = lineStart[textStart];
			const to = lineStart[textEnd] + lines[textEnd].length;

			segments.push({ type: 'text', from, to, text: lines.slice(textStart, textEnd + 1).join('\n') });
			textStart = -1;
			textEnd = -1;
		};

		const flushCode = () => {
			if (codeStart >= 0) {
				const from = lineStart[codeStart];
				const to = lineStart[codeEnd] + lines[codeEnd].length;

				segments.push({ type: 'code', from, to, text: lines.slice(codeStart, codeEnd + 1).join('\n'), lang });
			} else {
				const pos = (codeOpenLine >= 0) ? (lineStart[codeOpenLine] + lines[codeOpenLine].length) : text.length;

				segments.push({ type: 'code', from: pos, to: pos, text: '', lang });
			};

			codeStart = -1;
			codeEnd = -1;
			codeOpenLine = -1;
			lang = '';
		};

		for (let i = 0; i < lines.length; i++) {
			const trimmed = lines[i].trim();

			if (!inCode && (trimmed.indexOf(FENCE) == 0)) {
				flushText();
				inCode = true;
				lang = trimmed.substring(FENCE.length).trim();
				codeOpenLine = i;
				continue;
			};

			if (inCode && (trimmed == FENCE)) {
				flushCode();
				inCode = false;
				continue;
			};

			if (inCode) {
				if (codeStart < 0) {
					codeStart = i;
				};
				codeEnd = i;
			} else {
				if (textStart < 0) {
					textStart = i;
				};
				textEnd = i;
			};
		};

		if (inCode) {
			flushCode();
		} else {
			flushText();
		};

		return segments;
	};

	/** Derive ChatMessageBlocks from fenced text. hasCode is true iff a code block was produced. */
	fenceToBlocks (value: string, marks: I.Mark[]): { blocks: I.ChatMessageBlock[]; hasCode: boolean } {
		const text = String(value || '');
		const segments = this.getSegments(text);
		const blocks: I.ChatMessageBlock[] = [];

		let hasCode = false;

		for (const seg of segments) {
			if (seg.type == 'code') {
				// Skip degenerate empty code blocks (a lone/stray fence or an all-whitespace body).
				if (!seg.text.trim().length) {
					continue;
				};

				hasCode = true;

				const block: I.ChatMessageBlock = {
					text: { text: seg.text, style: I.TextStyle.Code, marks: [] },
				};

				if (seg.lang) {
					block.text.lang = seg.lang;
				};

				blocks.push(block);
			} else {
				// Skip empty / whitespace-only paragraph segments (e.g. blank lines around fences).
				if (!seg.text.trim().length) {
					continue;
				};

				const part = Mark.getPartOfString(text, { from: seg.from, to: seg.to }, marks || []);

				// checkRanges clamps marks to the sliced block's own length — getPartOfString does not,
				// so a mark straddling the paragraph/code boundary would otherwise carry an out-of-bounds range.
				blocks.push({
					text: { text: part.text, style: I.TextStyle.Paragraph, marks: Mark.checkRanges(part.text, part.marks || []) },
				});
			};
		};

		// blocks are only meaningful when the message actually contains a code block;
		// otherwise the flat content path is used and blocks stays empty.
		return { blocks: hasCode ? blocks : [], hasCode };
	};

	/**
	 * Rebuild text (+ re-offset paragraph marks) from blocks.
	 * - 'fenced': wraps code blocks in ```lang\n...\n``` (the composer's raw form on edit)
	 * - 'plain':  emits the raw code text, code-segment marks dropped
	 * - 'marked': emits the raw code text AND adds a Code mark over each code region
	 *             (so code renders as monospace markup in content.text — the cross-platform path)
	 */
	private buildText (blocks: I.ChatMessageBlock[], mode: 'fenced' | 'plain' | 'marked'): { text: string; marks: I.Mark[] } {
		const parts: string[] = [];
		const marks: I.Mark[] = [];

		let offset = 0;

		(blocks || []).forEach(b => {
			const bt = b.text;
			if (!bt) {
				return;
			};

			let part = '';

			if (bt.style == I.TextStyle.Code) {
				if (mode == 'fenced') {
					part = FENCE + (bt.lang || '') + '\n' + String(bt.text || '') + '\n' + FENCE;
				} else {
					part = String(bt.text || '');

					if ((mode == 'marked') && part.length) {
						marks.push({ type: I.MarkType.Code, param: '', range: { from: offset, to: offset + part.length } });
					};
				};
			} else {
				part = String(bt.text || '');

				(bt.marks || []).forEach(m => marks.push({ ...m, range: { from: m.range.from + offset, to: m.range.to + offset } }));
			};

			parts.push(part);
			offset += part.length + 1; // + the '\n' that join() inserts before the next part
		});

		const text = parts.join('\n');
		return { text, marks: Mark.checkRanges(text, marks) };
	};

	/** Reverse of fenceToBlocks: fenced composer text for editing a code message (blocks path, kept for later). */
	blocksToFence (blocks: I.ChatMessageBlock[]): { text: string; marks: I.Mark[] } {
		return this.buildText(blocks, 'fenced');
	};

	/** Plain, fence-less text (+ paragraph marks) — blocks path, kept for later. */
	blocksToText (blocks: I.ChatMessageBlock[]): { text: string; marks: I.Mark[] } {
		return this.buildText(blocks, 'plain');
	};

	/** Fence-less text where each code region carries a Code mark — the content.text + marks we actually store. */
	blocksToMarkedText (blocks: I.ChatMessageBlock[]): { text: string; marks: I.Mark[] } {
		return this.buildText(blocks, 'marked');
	};

	/**
	 * On send: turn ``` fenced regions into a Code mark over the (fence-less) code text in content.text.
	 * Keeps everything in content.text + marks (no blocks) so every client renders it (monospace markup).
	 */
	fenceToCodeMarks (value: string, marks: I.Mark[]): { text: string; marks: I.Mark[] } {
		const { blocks, hasCode } = this.fenceToBlocks(value, marks);
		return hasCode ? this.blocksToMarkedText(blocks) : { text: String(value || ''), marks: marks || [] };
	};

	/**
	 * On edit: rebuild the composer's raw ``` fences from a stored multiline Code mark.
	 * Single-line Code marks are left as inline marks (the composer renders them live, like inline code).
	 */
	codeMarksToFence (value: string, marks: I.Mark[]): { text: string; marks: I.Mark[] } {
		const text = String(value || '');
		const all = marks || [];
		const codeMarks = all
			.filter(m => (m.type == I.MarkType.Code) && text.slice(m.range.from, m.range.to).includes('\n'))
			.sort((a, b) => a.range.from - b.range.from);

		if (!codeMarks.length) {
			return { text, marks: all };
		};

		const OPEN = FENCE + '\n';
		const CLOSE = '\n' + FENCE;
		const keep = all.filter(m => !codeMarks.includes(m));

		let out = '';
		let cursor = 0;

		for (const cm of codeMarks) {
			const from = Math.max(cursor, Math.min(cm.range.from, text.length));
			const to = Math.max(from, Math.min(cm.range.to, text.length));

			out += text.slice(cursor, from);
			out += OPEN + text.slice(from, to) + CLOSE;
			cursor = to;
		};
		out += text.slice(cursor);

		// Shift the surviving marks by the fence characters inserted before each position.
		const insertedBefore = (pos: number): number => {
			let add = 0;
			for (const cm of codeMarks) {
				if (pos > cm.range.from) {
					add += OPEN.length;
				};
				if (pos > cm.range.to) {
					add += CLOSE.length;
				};
			};
			return add;
		};
		const adjusted = keep.map(m => ({ ...m, range: { from: m.range.from + insertedBefore(m.range.from), to: m.range.to + insertedBefore(m.range.to) } }));

		return { text: out, marks: Mark.checkRanges(out, adjusted) };
	};

	/**
	 * Split content.text + marks into render runs for the message bubble.
	 * A multiline Code mark becomes a { code: true } run (rendered as its own block element, so it
	 * needs no bordering <br> — avoids empty lines and selection artifacts). Everything else is a
	 * { code: false } text run carrying its own inline marks. The single newline that borders a code
	 * run is dropped (the block provides the visual separation).
	 */
	splitCodeRuns (value: string, marks: I.Mark[]): { code: boolean; text: string; marks: I.Mark[] }[] {
		const text = String(value || '');
		const all = marks || [];
		const codeMarks = all
			.filter(m => (m.type == I.MarkType.Code) && text.slice(m.range.from, m.range.to).includes('\n'))
			.sort((a, b) => a.range.from - b.range.from);

		if (!codeMarks.length) {
			return [ { code: false, text, marks: all } ];
		};

		const runs: { code: boolean; text: string; marks: I.Mark[] }[] = [];

		const pushText = (from: number, to: number) => {
			if (to <= from) {
				return;
			};
			const part = Mark.getPartOfString(text, { from, to }, all);
			runs.push({ code: false, text: part.text, marks: Mark.checkRanges(part.text, part.marks || []) });
		};

		let cursor = 0;

		for (const cm of codeMarks) {
			const from = Math.max(cursor, Math.min(cm.range.from, text.length));
			const to = Math.max(from, Math.min(cm.range.to, text.length));

			pushText(cursor, (text[from - 1] == '\n') ? (from - 1) : from);
			runs.push({ code: true, text: text.slice(from, to), marks: [] });
			cursor = (text[to] == '\n') ? (to + 1) : to;
		};
		pushText(cursor, text.length);

		return runs;
	};

	/** True when the caret sits on an opening-fence line or inside an unclosed code body. */
	isInOpenCodeFence (value: string, caret: number): boolean {
		const text = String(value || '');
		const c = Math.max(0, Math.min(Number(caret) || 0, text.length));
		const lines = text.substring(0, c).split('\n');

		let inCode = false;

		for (let i = 0; i < lines.length; i++) {
			const trimmed = lines[i].trim();
			const isCaretLine = (i == lines.length - 1);

			if (isCaretLine) {
				if (inCode) {
					return trimmed != FENCE;
				};
				return trimmed.indexOf(FENCE) == 0;
			};

			if (!inCode && (trimmed.indexOf(FENCE) == 0)) {
				inCode = true;
			} else
			if (inCode && (trimmed == FENCE)) {
				inCode = false;
			};
		};

		return inCode;
	};

	/** True when the [from, to] range falls inside a fenced code block body (closed or still-open). */
	isInCode (value: string, from: number, to: number): boolean {
		return this.getSegments(value).some(s => (s.type == 'code') && (from >= s.from) && (to <= s.to));
	};

	/** True when pos sits inside an open single-backtick inline-code run (odd number of backticks before it). */
	isInInlineCode (value: string, pos: number): boolean {
		const before = String(value || '').substring(0, Math.max(0, Number(pos) || 0));
		return ((before.match(/`/g) || []).length % 2) == 1;
	};

};

export default new UtilChat();
