import { I, Util } from 'ts/lib';

const $ = require('jquery');
const Tags = [ 'strike', 'kbd', 'italic', 'bold', 'underline', 'lnk', 'color', 'bgcolor', 'mention', 'emoji' ];

enum Overlap {
	Equal		 = 0,		 // a == b
	Outer		 = 1,		 // b inside a
	Inner		 = 2,		 // a inside b
	InnerLeft	 = 3,		 // a inside b, left side eq
	InnerRight	 = 4,		 // a inside b, right side eq
	Left		 = 5,		 // a-b
	Right		 = 6,		 // b-a
	Before		 = 7,		 // a ... b
	After		 = 8,		 // b ... a
};

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

		for (let item of Markdown) {
			const k = Util.filterFix(item.key);
			this.regexpMarkdown.push({ 
				key: item.key, 
				type: item.type,
				reg: new RegExp('([^\\*_]+)(' + k + ')([^`\\*_~]+)(' + k + ')(\\s)'),
			});
			this.regexpMarkdown.push({ 
				key: item.key, 
				type: item.type,
				reg: new RegExp('(^)(' + k + ')([^`\\*_~]+)(' + k + ')($)'),
			});
		};
	};
	
	toggle (marks: I.Mark[], mark: I.Mark): I.Mark[] {
		if (mark.range.from == mark.range.to) {
			return marks;	
		};

		let map = Util.map(marks, 'type');
		let type = mark.type;
		let add = true;

		map[type] = map[type] || [];
		map[type].slice().sort(this.sort);
		
		for (let i = 0; i < map[type].length; ++i) {
			let del = false;
			let el = map[type][i];
			let overlap = this.overlap(mark.range, el.range);
			
			switch (overlap) {
				case Overlap.Equal:
					if (!mark.param) {
						del = true;
					} else {
						el.param = mark.param;
					};
					add = false;
					break;
					
				case Overlap.Outer:
					del = true;
					break;
				
				case Overlap.InnerLeft:
					el.range.from = mark.range.to;
					if (!mark.param) {
						add = false;
					};
					break;
					
				case Overlap.InnerRight:
					el.range.to = mark.range.from;
					if (!mark.param) {
						add = false;
					};
					break;
					
				case Overlap.Inner:
					map[type].push({ type: el.type, param: el.param, range: { from: mark.range.to, to: el.range.to } });
					el.range.to = mark.range.from;
					
					if (!mark.param) {
						add = false;
					};
					i = map[type].length;
					break;
					
				case Overlap.Left:
					if (el.param == mark.param) {
						el.range.from = mark.range.from;
						add = false;
					} else {
						el.range.from = mark.range.to;
					};
					break;
					
				case Overlap.Right:
					if (el.param == mark.param) {
						el.range.to = mark.range.to;
						mark = el;
						add = false;
					} else {
						el.range.to = mark.range.from;
						add = true;
					};
					break;
					
				case Overlap.Before:
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
		return Util.unmap(map).sort(this.sort);
	};
	
	move (marks: I.Mark[], start: number, diff: number) {
		marks = marks || [];
		for (let mark of marks) {
			if ((mark.range.from < start && mark.range.to >= start) || (!start && !mark.range.from)) {
				mark.range.to += diff;
			} else
			if (mark.range.from >= start) {
				mark.range.from += diff;
				mark.range.to += diff;
			};
		};
		return marks;
	};
	
	sort (c1: I.Mark, c2: I.Mark) {
		if (c1.type > c2.type) return 1;
		if (c1.type < c2.type) return -1;
		if (c1.range.from > c2.range.from) return 1;
		if (c1.range.from < c2.range.from) return -1;
		if (c1.range.to > c2.range.to) return 1;
		if (c1.range.to < c2.range.to) return -1;
		return 0;
	};
	
	checkRanges (text: string, marks: I.Mark[]) {
		marks = (marks || []).slice().sort(this.sort);
		
		for (let i = 0; i < marks.length; ++i) {
			let mark = marks[i];
			let prev = marks[(i - 1)];
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
				([ I.MarkType.Mention, I.MarkType.Emoji ].indexOf(prev.type) < 0) && 
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
					let t = mark.range.to;
					mark.range.to = mark.range.from;
					mark.range.from = t;
				};
			};
		};
		return marks;
	};
	
	getInRange (marks: I.Mark[], type: I.MarkType, range: I.TextRange): any {
		let map = Util.map(marks, 'type');
		if (!map[type] || !map[type].length) {
			return null;
		};
		
		for (let mark of map[type]) {
			let overlap = this.overlap(range, mark.range);
			if ([ Overlap.Inner, Overlap.InnerLeft, Overlap.InnerRight, Overlap.Equal ].indexOf(overlap) >= 0) {
				return mark;
			};
		};
		return null;
	};

	adjust (marks: I.Mark[], from: number, length: number) {
		for (let mark of marks) {
			if ((mark.range.from <= from) && (mark.range.to > from)) {
				mark.range.to += length;
			} else
			if (mark.range.from >= from) {
				mark.range.from += length;
				mark.range.to += length;
			};
		};
		return marks;
	};
	
	toHtml (text: string, marks: I.Mark[]) {
		text = String(text || '');
		marks = this.checkRanges(text, marks || []);

		let r = text.split('');
		let parts: I.Mark[] = [];
		let borders: any[] = [];
		let ranges: any[] = [];
		let hasParam = [ I.MarkType.Link, I.MarkType.TextColor, I.MarkType.BgColor, I.MarkType.Mention, I.MarkType.Emoji ];
		
		for (let mark of marks) {
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

		for (let range of ranges) {
			for (let mark of marks) {
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
			if (!param && (hasParam.indexOf(mark.type) >= 0)) {
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

			if ((mark.type == I.MarkType.Mention) || (mark.type == I.MarkType.Emoji)) {
				prefix = '<smile></smile><name>';
				suffix = '</name>';
			};

			if (r[mark.range.from] && r[mark.range.to - 1]) {
				r[mark.range.from] = `<${tag} ${attr} ${data.join(' ')}>${prefix}${r[mark.range.from]}`;
				r[mark.range.to - 1] += `${suffix}</${tag}>`;
			};
		};

		for (let mark of parts) {
			if (mark.type == I.MarkType.Mention) {
				continue;
			};
			render(mark);
		};

		for (let mark of marks) {
			if (mark.type != I.MarkType.Mention) {
				continue;
			};
			render(mark);
		};

		// Replace tags in text
		for (let i = 0; i < r.length; ++i) {
			r[i] = r[i].replace(/<$/, '&lt;');
			r[i] = r[i].replace(/^>/, '&gt;');
		};
		return r.join('');
	};

	cleanHtml (html: string) {
		html = html.replace(/&nbsp;/g, ' ');
		html = html.replace(/<br\/?>/g, '\n');

		// Remove inner tags from mentions and emoji
		let obj = $(`<div>${html}</div>`);
		
		obj.find('mention').removeAttr('class').each((i: number, item: any) => {
			item = $(item);
			item.html(item.find('name').html());
		});

		obj.find('font').removeAttr('face').each((i: number, item: any) => {
			item = $(item);
			item.html(item.find('span').html());
		})

		obj.find('emoji').removeAttr('class').html(' ');
		return obj;
	};
	
	fromHtml (html: string): { marks: I.Mark[], text: string } {
		const rh = new RegExp('<(\/)?(' + Tags.join('|') + ')(?:([^>]*)>|>)', 'ig');
		const rp = new RegExp('data-param="([^"]*)"', 'i');
		const obj = this.cleanHtml(html);

		html = obj.html();
		html = html.replace(/data-range="[^"]+"/g, '');
		html = html.replace(/contenteditable="[^"]+"/g, '');

		let text = html;
		let marks: any[] = [];

		// Fix browser markup bug
		html.replace(/<\/?(i|b|font)>/g, (s: string, p: string) => {
			let r = '';
			if (p == 'i') r = 'italic';
			if (p == 'b') r = 'bold';
			p = r ? s.replace(p, r) : '';
			text = text.replace(s, p);
			return '';
		});

		// Fix html special symbols
		html.replace(/(&lt;|&gt;|&amp;)/g, (s: string, p: string) => {
			if (p == '&lt;') p = '<';
			if (p == '&gt;') p = '>';
			if (p == '&amp;') p = '&';
			if (p == '->') p = '→';
			if (p == '<-') p = '←';
			text = text.replace(s, p);
			return '';
		});

		html = text;

		// Unicode symbols
		html.replace(/(-->|<--|<-->|->|<-)\s/g, (s: string, p: string) => {
			if (p == '->') p = '→';
			if (p == '<-') p = '←';
			if (p == '-->') p = '⟶';
			if (p == '<--') p = '⟵';
			if (p == '<-->') p = '⟷';
			text = text.replace(s, p + ' ');
			return '';
		});

		html.replace(rh, (s: string, p1: string, p2: string, p3: string) => {
			p1 = String(p1 || '').trim();
			p2 = String(p2 || '').trim();
			p3 = String(p3 || '').trim();

			let end = p1 == '/';
			let offset = Number(text.indexOf(s)) || 0;
			let type = Tags.indexOf(p2);

			if (end) {
				for (let i = 0; i < marks.length; ++i) {
					let m = marks[i];
					if ((m.type == type) && !m.range.to) {
						marks[i].range.to = offset;
						break;
					};
				};
			} else {
				let pm = p3.match(rp);
				let param = pm ? pm[1]: '';
				
				marks.push({
					type: type,
					range: { from: offset, to: 0 },
					param: param,
				});
			};

			text = text.replace(s, '');
			return '';
		});

		return this.fromMarkdown(text, marks);
	};

	fromMarkdown (html: string, marks: I.Mark[]) {
		let text = html;

		// Markdown
		for (let item of this.regexpMarkdown) {
			html.replace(item.reg, (s: string, p1: string, p2: string, p3: string, p4: string, p5: string) => {
				p1 = String(p1 || '');
				p2 = String(p2 || '');
				p3 = String(p3 || '');
				p4 = String(p4 || '');
				p5 = String(p5 || '');

				let offset = Number(text.indexOf(s)) || 0;
				let from = offset + p1.length;
				let to = from + p3.length;

				// Marks should be moved by replacement lengths
				for (let i in marks) {
					let m = marks[i];
					if (m.range.from >= from) {
						m.range.from -= p2.length + p4.length;
						m.range.to -= p2.length + p4.length;
					};
				};

				marks.push({ type: item.type, range: { from: from, to: to }, param: '' });
				text = text.replace(s, p1 + p3 + ' ');
				return s;
			});
		};

		marks = this.checkRanges(text, marks);
		return { marks, text };
	};
	
	paramToAttr (type: I.MarkType, param: string): string {
		let attr = '';
		
		if (!param) {
			return attr;
		};
		
		switch (type) {
			case I.MarkType.Link:
				attr = 'href="' + param + '"';
				break;

			case I.MarkType.Mention:
				attr = 'contenteditable="false"';
				break;

			case I.MarkType.Emoji:
				attr = 'contenteditable="false"';
				break;
				
			case I.MarkType.TextColor:
				attr = 'class="textColor textColor-' + param + '"';
				break;
				
			case I.MarkType.BgColor:
				attr = 'class="bgColor bgColor-' + param + '"';
				break;
		};
		
		return attr;
	};
	
	overlap (a: I.TextRange, b: I.TextRange): Overlap {
		if (a.from == b.from && a.to == b.to) {
			return Overlap.Equal;
		} else
		if (a.to < b.from) {
			return Overlap.Before;
		} else
		if (a.from > b.to) {
			return Overlap.After;
		} else
		if ((a.from <= b.from) && (a.to >= b.to)) {
			return Overlap.Outer;
		} else
		if ((a.from > b.from) && (a.to < b.to)) {
			return Overlap.Inner;
		} else
		if ((a.from == b.from) && (a.to < b.to)) {
			return Overlap.InnerLeft;
		} else
		if ((a.from > b.from) && (a.to == b.to)) {
			return Overlap.InnerRight;
		} else
		if ((a.from < b.from) && (a.to >= b.from)) {
			return Overlap.Left;
		} else {
			return Overlap.Right;
		};
	};
	
};

export default new Mark();