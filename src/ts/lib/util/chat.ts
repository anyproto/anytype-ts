import * as I from 'Interface';
import Mark from 'Lib/mark';

console.log('[cb] BUILD MARKER: U.Chat (codeblock branch) module loaded');

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

		if (text.includes(FENCE)) {
			console.log('[cb] getSegments in=', JSON.stringify(text), 'out=', segments.map(s => `${s.type}:${JSON.stringify(s.text)}`));
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

};

export default new UtilChat();
