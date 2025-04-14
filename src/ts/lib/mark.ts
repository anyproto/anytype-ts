import $ from 'jquery';
import { I, U, J } from 'Lib';

const Tags = {};
for (const i in I.MarkType) {
	if (!isNaN(Number(i))) {
		Tags[i] = `markup${I.MarkType[i].toLowerCase()}`;
	};
};

const Patterns = {
	'-→': '⟶',
	'—>': '⟶',
	'->': '→',

	'←-': '⟵',
	'<—': '⟵',
	'<-': '←',
	
	'←→': '⟷',
	'<-->': '⟷',
	'⟵>': '⟷',
	'<⟶': '⟷',

	'--': '—',

	//'(c)': '©',
	'(r)': '®',
	'(tm)': '™',
	'...': '…',
};

const Order = [
	I.MarkType.Change,
	I.MarkType.Object,
	I.MarkType.Emoji,
	I.MarkType.Mention,
	I.MarkType.Link,
	I.MarkType.Underline,
	I.MarkType.Strike,
	I.MarkType.Italic,
	I.MarkType.Bold,
	I.MarkType.Color,
	I.MarkType.BgColor,
	I.MarkType.Code,
];

class Mark {

	toggle (marks: I.Mark[], mark: I.Mark): I.Mark[] {
		if ((mark.type === null) || (mark.range.from == mark.range.to)) {
			return marks;	
		};

		const map = U.Common.mapToArray(marks, 'type');
		const type = mark.type;

		let add = true;

		map[type] = map[type] || [];
		map[type].slice().sort(this.sort);
		
		for (let i = 0; i < map[type].length; ++i) {
			const el = map[type][i];
			const overlap = this.overlap(mark.range, el.range);

			let del = false;
			
			switch (overlap) {
				case I.MarkOverlap.Equal:
					if (!mark.param) {
						del = true;
					} else {
						el.param = mark.param;
					};
					add = false;
					break;
					
				case I.MarkOverlap.Outer:
					del = true;
					break;
				
				case I.MarkOverlap.InnerLeft:
					el.range.from = mark.range.to;

					if (!mark.param) {
						add = false;
					};
					break;
					
				case I.MarkOverlap.InnerRight:
					el.range.to = mark.range.from;
					if (!mark.param) {
						add = false;
					};
					break;
					
				case I.MarkOverlap.Inner:
					map[type].push({ type: el.type, param: el.param, range: { from: mark.range.to, to: el.range.to } });
					
					el.range.to = mark.range.from;
					if (!mark.param) {
						add = false;
					};
					i = map[type].length;
					break;
					
				case I.MarkOverlap.Left:
					if (el.param == mark.param) {
						el.range.from = mark.range.from;
						add = false;
					} else {
						el.range.from = mark.range.to;
					};
					break;
					
				case I.MarkOverlap.Right:
					if (![ I.MarkType.Emoji ].includes(el.type) && (el.param == mark.param)) {
						el.range.to = mark.range.to;
						mark = el;
						add = false;
					} else {
						el.range.to = mark.range.from;
						add = true;
					};
					break;
					
				case I.MarkOverlap.Before:
					i = map[type].length;
					break;
			};
			
			if (del) {
				map[type].splice(i, 1);
				i = -1;
			};
		};
		
		if (add) {
			map[type].push(mark);
		};
		
		return U.Common.unmap(map).sort(this.sort);
	};
	
	sort (c1: I.Mark, c2: I.Mark) {
		const o1 = Order.indexOf(c1.type);
		const o2 = Order.indexOf(c2.type);
		if (o1 > o2) return 1;
		if (o1 < o2) return -1;
		if (c1.range.from > c2.range.from) return 1;
		if (c1.range.from < c2.range.from) return -1;
		if (c1.range.to > c2.range.to) return 1;
		if (c1.range.to < c2.range.to) return -1;
		return 0;
	};
	
	checkRanges (text: string, marks: I.Mark[]) {
		marks = (marks || []).slice().sort(this.sort);
		
		for (let i = 0; i < marks.length; ++i) {
			const mark = marks[i];
			const prev = marks[(i - 1)];

			let del = false;
			if (mark.range.from >= text.length) {
				del = true;
			};
			if (mark.range.from == mark.range.to) {
				del = true;
			};
			if ((mark.range.from < 0) || (mark.range.to < 0)) {
				del = true;
			};
			
			// Combine two marks into one
			if (prev && 
				![ I.MarkType.Mention, I.MarkType.Emoji ].includes(prev.type) && 
				(prev.range.to >= mark.range.from) && 
				(prev.type == mark.type) && 
				(prev.param == mark.param)) {
				prev.range.to = mark.range.to;
				del = true;
			};
			
			if (del) {
				marks.splice(i, 1);
				i--;
			} else {
				if (mark.range.from < 0) {
					mark.range.from = 0;
				};
				
				if (mark.range.to > text.length) {
					mark.range.to = text.length;
				};
				
				if (mark.range.from > mark.range.to) {
					const t = mark.range.to;
					mark.range.to = mark.range.from;
					mark.range.from = t;
				};
			};
		};
		return marks;
	};
	
	getInRange (marks: I.Mark[], type: I.MarkType, range: I.TextRange): any {
		if (!range) {
			return null;
		};

		const map = U.Common.mapToArray(marks, 'type');
		const overlaps = [ I.MarkOverlap.Inner, I.MarkOverlap.InnerLeft, I.MarkOverlap.InnerRight, I.MarkOverlap.Equal ];

		if (!map[type] || !map[type].length) {
			return null;
		};
		
		for (const mark of map[type]) {
			if (overlaps.includes(this.overlap(range, mark.range))) {
				return mark;
			};
		};
		return null;
	};

	adjust (marks: I.Mark[], from: number, length: number) {
		marks = U.Common.objectCopy(marks || []);

		for (const mark of marks) {
			if ((mark.range.from < from) && (mark.range.to > from)) {
				mark.range.to += length;
			} else
			if (mark.range.from >= from) {
				mark.range.from += length;
				mark.range.to += length;
			};
			mark.range.from = Math.max(0, mark.range.from);
		};

		return marks;
	};
	
	toHtml (text: string, marks: I.Mark[]) {
		text = String(text || '');
		marks = this.checkRanges(text, marks || []);

		const r = text.split('');
		const parts: I.Mark[] = [];
		const ranges: any[] = [];
		const hasParam = [ 
			I.MarkType.Link, 
			I.MarkType.Object, 
			I.MarkType.Color, 
			I.MarkType.BgColor, 
			I.MarkType.Mention, 
			I.MarkType.Emoji,
		];
		const priorityRender = [ I.MarkType.Mention, I.MarkType.Emoji ];

		let borders: any[] = [];
		
		for (const mark of marks) {
			borders.push(Number(mark.range.from));
			borders.push(Number(mark.range.to));
		};

		borders.sort(function (c1, c2) {
			if (c1 > c2) return 1;
			if (c1 < c2) return -1;
			return 0;
		});
		borders = [ ...new Set(borders) ];

		for (let i = 0; i < borders.length; ++i) {
			if (!borders[i + 1]) {
				break;
			};
			ranges.push({ from: borders[i], to: borders[i + 1] });
		};

		for (const range of ranges) {
			for (const mark of marks) {
				if ((mark.range.from <= range.from) && (mark.range.to >= range.to)) {
					parts.push({
						type: mark.type,
						param: mark.param,
						range: { from: range.from, to: range.to }
					});
				};
			};
		};

		const render = (mark: I.Mark) => {
			const param = String(mark.param || '');
			if (!param && hasParam.includes(mark.type)) {
				return;
			};

			const tag = this.getTag(mark.type);
			if (!tag) {
				return;
			};

			const fixedParam = param.replace(/([^\\])\$/gi, '$1\\$'); // Escape $ symbol for inline LaTeX
			const attr = this.paramToAttr(mark.type, fixedParam);
			const data = [];

			if (param) {
				data.push(`data-param="${fixedParam}"`);
			};

			if ([ I.MarkType.Link, I.MarkType.Object, I.MarkType.Mention ].includes(mark.type)) {
				data.push(`data-range="${mark.range.from}-${mark.range.to}"`);
			};

			let prefix = '';
			let suffix = '';

			if (mark.type == I.MarkType.Mention) {
				prefix = '<smile></smile><img src="./img/space.svg" class="space" /><name>';
				suffix = '</name>';
			};

			if (mark.type == I.MarkType.Emoji) {
				prefix = '<smile></smile>';
			};

			if (r[mark.range.from] && r[mark.range.to - 1]) {
				r[mark.range.from] = `<${tag} ${attr} ${data.join(' ')}>${prefix}${r[mark.range.from]}`;
				r[mark.range.to - 1] += `${suffix}</${tag}>`;
			};
		};

		// Render priority marks
		for (const mark of marks) {
			if (priorityRender.includes(mark.type)) {
				render(mark);
			};
		};

		// Render everything except priority marks
		for (const mark of parts) {
			if (!priorityRender.includes(mark.type)) {
				render(mark);
			};
		};

		// Replace tags in text
		for (let i = 0; i < r.length; ++i) {
			r[i] = r[i].replace(/<$/, '&lt;');
			r[i] = r[i].replace(/^>/, '&gt;');
		};

		return r.join('');
	};

	cleanHtml (html: string) {
		html = String(html || '');
		html = html.replace(/&nbsp;/g, ' ');
		html = html.replace(/<br\/?>/g, '\n');

		// Remove inner tags from mentions and emoji
		const obj = $(`<div>${html}</div>`);
		
		obj.find(this.getTag(I.MarkType.Mention)).removeAttr('class').each((i: number, item: any) => {
			item = $(item);
			item.html(item.find('name').html());
		});

		obj.find('font').each((i: number, item: any) => {
			item = $(item);

			const html = item.find('span').html();
			const face = String(item.attr('face') || '').toLowerCase();

			if (face == J.Constant.fontCode) {
				const tag = this.getTag(I.MarkType.Code);
				item.replaceWith(`<${tag}>${html}</${tag}>`);
			} else {
				item.html(html);
			};
		});

		obj.find(this.getTag(I.MarkType.Emoji)).removeAttr('class').html(' ');
		return obj;
	};
	
	fromHtml (html: string, restricted: I.MarkType[]): { marks: I.Mark[], text: string, adjustMarks: boolean } {
		const tags = this.getTags();
		const rh = new RegExp(`<(\/)?(${Object.values(tags).join('|')})(?:([^>]*)>|>)`, 'ig');
		const rp = new RegExp('data-param="([^"]*)"', 'i');
		const obj = this.cleanHtml(html);
		const marks: I.Mark[] = [];

		html = obj.html();

		let text = html;

		text = text.replace(/data-range="[^"]+"/g, '');
		text = text.replace(/contenteditable="[^"]+"/g, '');

		// TODO: find classes by color or background
		text = text.replace(/<font(?:[^>]*?)>([^<]*)(?:<\/font>)?/g, (s: string, p: string) => p);
		text = text.replace(/<span style="background-color:(?:[^;]+);">([^<]*)(?:<\/span>)?/g, (s: string, p: string) => p);
		text = text.replace(/<span style="font-weight:(?:[^;]+);">([^<]*)(?:<\/span>)?/g, (s: string, p: string) => p);

		// Fix browser markup bug
		text = text.replace(/<\/?(i|b|strike|font|search)[^>]*>/g, (s: string, p: string) => {
			let r = '';

			if (p == 'i') r = this.getTag(I.MarkType.Italic);
			if (p == 'b') r = this.getTag(I.MarkType.Bold);
			if (p == 'strike') r = this.getTag(I.MarkType.Strike);

			p = r ? s.replace(p, r) : '';
			return p;
		});

		// Fix html special symbols
		text = U.Common.fromHtmlSpecialChars(text);

		html = text;
		html.replace(rh, (s: string, p1: string, p2: string, p3: string) => {
			p1 = String(p1 || '').trim();
			p2 = String(p2 || '').trim();
			p3 = String(p3 || '').trim();

			const end = p1 == '/';
			const offset = Number(text.indexOf(s)) || 0;
			
			let type: any = U.Common.getKeyByValue(tags, p2);
			if (undefined === type) {
				return;
			};

			type = Number(type);

			if (end) {
				for (let i = 0; i < marks.length; ++i) {
					const m = marks[i];
					if ((m.type == type) && !m.range.to) {
						marks[i].range.to = offset;
						break;
					};
				};
			} else {
				const pm = p3.match(rp);
				const param = pm ? pm[1]: '';

				marks.push({
					type,
					range: { from: offset, to: 0 },
					param: param,
				});
			};

			text = text.replace(s, '');
			return '';
		});

		const parsed = this.fromUnicode(text, marks);
		return this.fromMarkdown(parsed.text, parsed.marks, restricted, parsed.adjustMarks);
	};

	fromMarkdown (html: string, marks: I.Mark[], restricted: I.MarkType[], adjustMarks: boolean): { marks: I.Mark[], text: string, adjustMarks: boolean } {
		const reg1 = /(^|\s)(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|~~[^~]+~~|\[[^\]]+\]\([^\)]+\)\s|$)/;
		const reg2 = /^[`\*_\[~]+/;
		const test = reg1.test(html);
		const checked = marks.filter(it => [ I.MarkType.Code ].includes(it.type));
		const overlaps = [ I.MarkOverlap.Left, I.MarkOverlap.Right, I.MarkOverlap.Inner, I.MarkOverlap.InnerLeft, I.MarkOverlap.InnerRight ];

		if (!test) {
			return { marks, text: html, adjustMarks };
		};

		let text = html;

		html.replace(reg1, (s: string, p1: string, p2: string, o: number) => {
			o = Number(o) || 0;

			const m = p2.match(reg2);
			if (!m) {
				return s;
			};

			const symbol = m[0];

			let type = null;
			switch (symbol) {
				case '`': {
					type = I.MarkType.Code;
					break;
				};

				case '**':
				case '__': {
					type = I.MarkType.Bold;
					break;
				};

				case '*':
				case '_': {
					type = I.MarkType.Italic;
					break;
				};

				case '~~': {
					type = I.MarkType.Strike;
					break;
				};
			};

			if ((type === null) || restricted.includes(type)) {
				return s;
			};

			const p1l = p1.length;
			const p2l = p2.length;
			const length = symbol.length;
			const from = o + p1l;
			const to = from + p2l - length * 2;
			const replace = p2.replace(new RegExp(U.Common.regexEscape(symbol), 'g'), '') + ' ';

			let check = true;
			for (const mark of checked) {
				const overlap = this.overlap({ from, to }, mark.range);
				if (overlaps.includes(overlap)) {
					check = false;
					break;
				};
			};

			if (!check) {
				return s;
			};

			marks = this.adjust(marks, from, -length);
			marks = this.adjust(marks, to, -length + 1);
			marks.push({ type, range: { from, to }, param: '' });

			text = U.Common.stringInsert(text, replace, o + p1l, o + p1l + p2l);
			adjustMarks = true;

			return s;
		});

		marks = this.checkRanges(text, marks);

		// Links
		html.replace(/\[([^\[\]]+)\]\(([^\(\)]+)\)(\s|$)/g, (s: string, p1: string, p2: string, p3: string) => {
			p1 = String(p1 || '');
			p2 = String(p2 || '');
			p3 = String(p3 || '');

			const from = (Number(text.indexOf(s)) || 0);
			const to = from + p1.length;
			const innerIdx = [];

			// Remove inner links and adjust other marks to new range
			for (let i = 0; i < marks.length; ++i) {
				const mark = marks[i];
				if ((mark.range.from >= from) && (mark.range.to <= from + p1.length + p2.length + 4)) {
					if ([ I.MarkType.Link, I.MarkType.Object ].includes(mark.type)) {
						marks.splice(i, 1);
						i--;
					} else {
						innerIdx.push(i);
					};
				};
			};

			marks = this.adjust(marks, from, -(p2.length + 4));

			for (const i of innerIdx) {
				marks[i].range.from = from;
				marks[i].range.to = to;
			};

			marks.push({ type: I.MarkType.Link, range: { from, to }, param: p2 });
			adjustMarks = true;

			text = text.replace(s, p1 + ' ');
			return s;
		});

		marks = this.checkRanges(text, marks);
		return { marks, text, adjustMarks };
	};

	// Unicode symbols
	fromUnicode (html: string, marks: I.Mark[]): { marks: I.Mark[], text: string, adjustMarks: boolean } {
		const keys = Object.keys(Patterns).map(it => U.Common.regexEscape(it));
		const reg = new RegExp(`(${keys.join('|')})`, 'g');
		const test = reg.test(html);
		const overlaps = [ I.MarkOverlap.Inner, I.MarkOverlap.InnerLeft, I.MarkOverlap.InnerRight, I.MarkOverlap.Equal ];

		if (!test) {
			return { marks, text: html, adjustMarks: false };
		};

		const checked = marks.filter(it => [ I.MarkType.Code, I.MarkType.Link ].includes(it.type));

		let text = html;
		let adjustMarks = false;

		html.replace(reg, (s: string, p: string, o: number) => {
			let check = true;
			for (const mark of checked) {
				const overlap = this.overlap({ from: o, to: o }, mark.range);
				if (overlaps.includes(overlap)) {
					check = false;
					break;
				};
			};

			if (check && Patterns[p]) {
				text = text.replace(s, Patterns[p]);
				marks = this.adjust(marks, o, Patterns[p].length - p.length);
				adjustMarks = true;
			};
			return '';
		});

		return { marks, text, adjustMarks };
	};
	
	paramToAttr (type: I.MarkType, param: string): string {
		let attr = '';
		
		if (!param) {
			return attr;
		};
		
		switch (type) {
			case I.MarkType.Link: {
				attr = `href="${U.Common.urlFix(param)}" class="markuplink"`;
				break;
			};

			case I.MarkType.Mention:
			case I.MarkType.Emoji: {
				attr = 'contenteditable="false"';
				break;
			};
				
			case I.MarkType.Color: {
				attr = `class="textColor textColor-${param}"`;
				break;
			};
				
			case I.MarkType.BgColor: {
				attr = `class="bgColor bgColor-${param}"`;
				break;
			};

		};
		return attr;
	};

	toggleLink (newMark: I.Mark, marks: I.Mark[]) {
		for (let i = 0; i < marks.length; ++i) {
			const mark = marks[i];
			if ([ I.MarkType.Link, I.MarkType.Object ].includes(mark.type) && 
				(mark.range.from >= newMark.range.from) && 
				(mark.range.to <= newMark.range.to) &&
				(mark.param == newMark.param)
			) {
				marks.splice(i, 1);
				i--;
			};
		};

		return this.toggle(marks, newMark);
	};
	
	overlap (a: I.TextRange, b: I.TextRange): I.MarkOverlap {
		if (a.from == b.from && a.to == b.to) {
			return I.MarkOverlap.Equal;
		} else
		if (a.to < b.from) {
			return I.MarkOverlap.Before;
		} else
		if (a.from > b.to) {
			return I.MarkOverlap.After;
		} else
		if ((a.from <= b.from) && (a.to >= b.to)) {
			return I.MarkOverlap.Outer;
		} else
		if ((a.from > b.from) && (a.to < b.to)) {
			return I.MarkOverlap.Inner;
		} else
		if ((a.from == b.from) && (a.to < b.to)) {
			return I.MarkOverlap.InnerLeft;
		} else
		if ((a.from > b.from) && (a.to == b.to)) {
			return I.MarkOverlap.InnerRight;
		} else
		if ((a.from < b.from) && (a.to >= b.from)) {
			return I.MarkOverlap.Left;
		} else {
			return I.MarkOverlap.Right;
		};
	};

	getTags () {
		const tags: any = {};

		for (const i in I.MarkType) {
			if (isNaN(I.MarkType[i] as any)) {
				tags[i] = this.getTag(i as any);
			};
		};

		return tags;
	};

	getTag (t: I.MarkType): string {
		if (t == I.MarkType.Link) {
			return 'a';
		};

		return I.MarkType[t] ? `markup${I.MarkType[t].toLowerCase()}` : '';
	};

	needsBreak (t: I.MarkType): boolean {
		return [ 
			I.MarkType.Link, 
			I.MarkType.Object, 
			I.MarkType.Search, 
			I.MarkType.Change, 
			I.MarkType.Highlight, 
			I.MarkType.Code,
		].includes(t);
	};

	canSave (t: I.MarkType): boolean {
		return ![ I.MarkType.Search, I.MarkType.Change, I.MarkType.Highlight ].includes(t);
	};

};

export default new Mark();
