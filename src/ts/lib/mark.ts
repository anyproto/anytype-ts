import $ from 'jquery';
import { I, UtilCommon, analytics } from 'Lib';
const Constant = require('json/constant.json');

const Tags = {};
for (const i in I.MarkType) {
	if (isNaN(Number(i))) {
		continue;
	};

	Tags[i] = `markup${I.MarkType[i].toLowerCase()}`;
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

const Order: any = {};

Order[I.MarkType.Object]	 = 0;
Order[I.MarkType.Emoji]		 = 1;
Order[I.MarkType.Mention]	 = 2;
Order[I.MarkType.Link]		 = 3;
Order[I.MarkType.Underline]	 = 4;
Order[I.MarkType.Strike]	 = 5;
Order[I.MarkType.Italic]	 = 6;
Order[I.MarkType.Bold]		 = 7;
Order[I.MarkType.Color]		 = 8;
Order[I.MarkType.BgColor]	 = 9;
Order[I.MarkType.Code]		 = 10;

class Mark {

	regexpMarkdown: any[] = [];

	constructor () {
		const Markdown = [
			{ key: '`', type: I.MarkType.Code },
			{ key: '**', type: I.MarkType.Bold },
			{ key: '__', type: I.MarkType.Bold },
			{ key: '*', type: I.MarkType.Italic },
			{ key: '_', type: I.MarkType.Italic },
			{ key: '~~', type: I.MarkType.Strike },
		];

		for (const item of Markdown) {
			const non = UtilCommon.regexEscape(item.key.substring(0, 1));
			const k = UtilCommon.regexEscape(item.key);
			this.regexpMarkdown.push({ 
				type: item.type,
				reg: new RegExp('([^\\*_]{1}|^)(' + k + ')([^' + non + ']+)(' + k + ')(\\s|$)', 'gi'),
			});
		};
	};
	
	toggle (marks: I.Mark[], mark: I.Mark): I.Mark[] {
		if ((mark.type === null) || (mark.range.from == mark.range.to)) {
			return marks;	
		};

		const map = UtilCommon.mapToArray(marks, 'type');
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

		analytics.event('ChangeTextStyle', { type, count: 1 });
		return UtilCommon.unmap(map).sort(this.sort);
	};
	
	sort (c1: I.Mark, c2: I.Mark) {
		const o1 = Order[c1.type];
		const o2 = Order[c2.type];
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
		const map = UtilCommon.mapToArray(marks, 'type');

		if (!map[type] || !map[type].length) {
			return null;
		};
		
		for (const mark of map[type]) {
			const overlap = this.overlap(range, mark.range);
			if ([ I.MarkOverlap.Inner, I.MarkOverlap.InnerLeft, I.MarkOverlap.InnerRight, I.MarkOverlap.Equal ].indexOf(overlap) >= 0) {
				return mark;
			};
		};
		return null;
	};

	adjust (marks: I.Mark[], from: number, length: number) {
		marks = marks || [];

		for (const mark of marks) {
			if ((mark.range.from <= from) && (mark.range.to > from)) {
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
		let borders: any[] = [];
		const ranges: any[] = [];
		const hasParam = [ 
			I.MarkType.Link, 
			I.MarkType.Object, 
			I.MarkType.Color, 
			I.MarkType.BgColor, 
			I.MarkType.Mention, 
			I.MarkType.Emoji,
		];
		
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

			const attr = this.paramToAttr(mark.type, param);
			const tag = Tags[mark.type];
			const data = [ `data-range="${mark.range.from}-${mark.range.to}"` ];
			
			if (param) {
				data.push(`data-param="${param}"`);
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

		// Render mentions
		for (const mark of marks) {
			if (mark.type == I.MarkType.Mention) {
				render(mark);
			};
		};

		// Render everything except mentions
		for (const mark of parts) {
			if (mark.type != I.MarkType.Mention) {
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

			if (face == Constant.fontCode) {
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
		const rh = new RegExp(`<(\/)?(${Object.values(Tags).join('|')})(?:([^>]*)>|>)`, 'ig');
		const rp = new RegExp('data-param="([^"]*)"', 'i');
		const obj = this.cleanHtml(html);
		const marks: I.Mark[] = [];

		html = obj.html();

		let text = html;

		text = text.replace(/data-range="[^"]+"/g, '');
		text = text.replace(/contenteditable="[^"]+"/g, '');

		// TODO: find classes by color or background
		text = text.replace(/<font(?:[^>]*?)>([^<]*)(?:<\/font>)?/g, (s: string, p: string) => {
			return p;
		});
		text = text.replace(/<span style="background-color:(?:[^;]+);">([^<]*)(?:<\/span>)?/g, (s: string, p: string) => {
			return p;
		});
		text = text.replace(/<span style="font-weight:(?:[^;]+);">([^<]*)(?:<\/span>)?/g, (s: string, p: string) => {
			return p;
		});

		// Fix browser markup bug
		text = text.replace(/<\/?(i|b|font|search)[^>]*>/g, (s: string, p: string) => {
			let r = '';
			if (p == 'i') r = this.getTag(I.MarkType.Italic);
			if (p == 'b') r = this.getTag(I.MarkType.Bold);
			p = r ? s.replace(p, r) : '';
			return p;
		});

		// Fix html special symbols
		text = text.replace(/(&lt;|&gt;|&amp;)/g, (s: string, p: string) => {
			if (p == '&lt;') p = '<';
			if (p == '&gt;') p = '>';
			if (p == '&amp;') p = '&';
			return p;
		});

		html = text;
		html.replace(rh, (s: string, p1: string, p2: string, p3: string) => {
			p1 = String(p1 || '').trim();
			p2 = String(p2 || '').trim();
			p3 = String(p3 || '').trim();

			const end = p1 == '/';
			const offset = Number(text.indexOf(s)) || 0;
			const type = Object.values(Tags).indexOf(p2);

			if (type < 0) {
				return;
			};

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
		const test = /((^|\s)_|[`\*~\[]){1}/.test(html);
		const checked = marks.filter(it => [ I.MarkType.Code ].includes(it.type));
		const overlaps = [ I.MarkOverlap.Left, I.MarkOverlap.Right, I.MarkOverlap.Inner, I.MarkOverlap.InnerLeft, I.MarkOverlap.InnerRight ];

		if (!test) {
			return { marks, text: html, adjustMarks };
		};

		let text = html;

		// Markdown
		for (const item of this.regexpMarkdown) {
			if (restricted.includes(item.type)) {
				continue;
			};

			html = text;
			html.replace(item.reg, (s: string, p1: string, p2: string, p3: string, p4: string, p5: string) => {
				p1 = String(p1 || '');
				p2 = String(p2 || '');
				p3 = String(p3 || '');
				p4 = String(p4 || '');
				p5 = String(p5 || '');

				const from = (Number(text.indexOf(s)) || 0) + p1.length;
				const to = from + p3.length;
				const replace = (p1 + p3 + ' ').replace(new RegExp('\\$', 'g'), '$$$');

				let check = true;
				for (const mark of checked) {
					const overlap = this.overlap({ from, to }, mark.range);
					if (overlaps.includes(overlap)) {
						check = false;
						break;
					};
				};

				if (check) {
					marks = this.adjust(marks, from, -p2.length);
					marks = this.adjust(marks, to, -p4.length);
					marks.push({ type: item.type, range: { from, to }, param: '' });

					text = text.replace(s, replace);
					adjustMarks = true;
				};
				return s;
			});
		};

		// Links
		html = text;
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

			marks.push({ type: I.MarkType.Link, range: { from: from, to: to }, param: p2 });
			adjustMarks = true;

			text = text.replace(s, p1 + ' ');
			return s;
		});

		marks = this.checkRanges(text, marks);
		return { marks, text, adjustMarks };
	};

	// Unicode symbols
	fromUnicode (html: string, marks: I.Mark[]): { marks: I.Mark[], text: string, adjustMarks: boolean } {
		const keys = Object.keys(Patterns).map(it => UtilCommon.regexEscape(it));
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
			case I.MarkType.Link:
				attr = `href="${param}"`;
				break;

			case I.MarkType.Mention:
			case I.MarkType.Emoji:
				attr = 'contenteditable="false"';
				break;
				
			case I.MarkType.Color:
				attr = `class="textColor textColor-${param}"`;
				break;
				
			case I.MarkType.BgColor:
				attr = `class="bgColor bgColor-${param}"`;
				break;
		};
		return attr;
	};

	toggleLink (newMark: I.Mark, marks: I.Mark[]) {
		for (let i = 0; i < marks.length; ++i) {
			const mark = marks[i];
			if ([ I.MarkType.Link, I.MarkType.Object ].includes(mark.type) && 
				(mark.range.from >= newMark.range.from) && 
				(mark.range.to <= newMark.range.to)
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

	getTag (t: I.MarkType) {
		return Tags[t];
	};
	
};

export default new Mark();