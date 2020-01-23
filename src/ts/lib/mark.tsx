import { I, Util } from 'ts/lib';

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

const Tags = [ 's', 'kbd', 'i', 'b', 'u', 'a', 'tc', 'hlc' ];

class Mark {
	
	toggle (marks: I.Mark[], mark: I.Mark): I.Mark[] {
		if (mark.range.from == mark.range.to) {
			return;	
		};
		
		let map = Util.map(marks, 'type');
		let type = mark.type;
		let ret: I.Mark[] = [] as I.Mark[];
		
		if (!map[type] || !map[type].length) {
			map[type] = [];
		};
		
		map[type].slice().sort(this.sort);
		
		let add = true;
		
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
		return Util.unmap(map);
	};
	
	move (marks: I.Mark[], start: number, diff: number) {
		marks = marks || [];
		
		for (let mark of marks) {
			if ((mark.range.from < start && mark.range.to >= start) || (!start && !mark.range.from)) {
				mark.range.to += diff;
				console.log('Move', mark.param, mark.range.to);
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
		marks = marks || [];
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
			
			if (mark.range.to < 0) {
				del = true;
			};
			
			if (prev && (prev.range.to >= mark.range.from) && (prev.type == mark.type) && (prev.param == mark.param)) {
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
	
	toHtml (text: string, marks: I.Mark[]) {
		text = String(text || '');
		marks = this.checkRanges(text, marks || []);
		
		let r = text.split('');
		
		for (let mark of marks) {
			let t = Tags[mark.type];
			let attr = this.paramToAttr(mark.type, mark.param);
			
			if (!attr && [ I.MarkType.Link, I.MarkType.TextColor, I.MarkType.BgColor ].indexOf(mark.type) >= 0) {
				continue;
			};
			
			if (r[mark.range.from] && r[mark.range.to - 1]) {
				r[mark.range.from] = '<' + t + (attr ? ' ' + attr : '') + '>' + r[mark.range.from];
				r[mark.range.to - 1] += '</' + t + '>';
			};
		};
		return r.join('');
	};
	
	fromHtml (html: string): I.Mark[] {
		const rs = new RegExp('<(' + Tags.join('|') + ')(:?([^>]+)>|>)', 'ig');
		const rt = new RegExp('<(' + Tags.join('|') + ')', 'i');
		const re = new RegExp('</(' + Tags.join('|') + ')>', 'ig');
		const m = html.match(rs);
		
		let marks = [] as I.Mark[];
		
		if (!m) {
			return marks;
		};
		
		for (let s of m) {
			let t = s.match(rt)[1];
			let a = s.match(new RegExp('<' + t + '\\s([^>]+)>', 'i'));
			
			let end = '</' + t + '>';
			let o1 = html.indexOf(s);
			
			html = html.replace(s, '');
			
			let o2 = html.indexOf(end);
			html = html.replace(end, '');
			
			marks.push({
				type: Tags.indexOf(t),
				range: {
					from: Number(o1) || 0,
					to: Number(o2) || 0,
				},
				param: this.attrToParam(a ? a[1] : ''),
			});
		};
		return marks;
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
				
			case I.MarkType.TextColor:
				attr = 'class="textColor textColor-' + param + '"';
				break;
				
			case I.MarkType.BgColor:
				attr = 'class="bgColor bgColor-' + param + '"';
				break;
		};
		
		return attr;
	};
	
	attrToParam (attr: string): string {
		attr = String(attr || '').trim();
		
		let m = attr.match(/(:?href|class)="([^"]+)"/);
		if (!m) {
			return '';
		};
		return m[2].replace('textColor textColor-', '').replace('bgColor bgColor-', '');
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