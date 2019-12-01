import { I } from 'ts/lib';

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
	
	map (marks: I.Mark[]): any {
		marks = marks || [] as I.Mark[];
		
		let map = {} as any;
		for (let mark of marks) {
			map[mark.type] = map[mark.type] || [];
			map[mark.type].push(mark);
		};
		return map;
	};
	
	unmap (map: any) {
		let ret: I.Mark[] = [] as I.Mark[];
		for (let type in map) {
			ret = ret.concat(map[type]);
		};
		return ret;
	};
	
	toggle (marks: I.Mark[], mark: I.Mark): I.Mark[] {
		let map = this.map(marks);
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
						el.range.from = mark.range.to;
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
		
		map[type] = this.clear(map[type]);
		return this.unmap(map);
	};
	
	move (marks: I.Mark[], start: number, diff: number) {
		marks.slice().sort(this.sort);
		for (let mark of marks) {
			let overlap = this.overlap({ from: start, to: start }, mark.range);
			if ([ Overlap.Inner, Overlap.InnerLeft, Overlap.InnerRight ].indexOf(overlap) >= 0) {
				mark.range.to += diff;
			};
			if (overlap == Overlap.Before) {
				mark.range.from += diff;
				mark.range.to += diff;
			};
		};
		return this.clear(marks);
	};
	
	sort (c1: I.Mark, c2: I.Mark) {
		if (c1.range.from > c2.range.from) return 1;
		if (c1.range.from < c2.range.from) return -1;
		if (c1.range.to > c2.range.to) return 1;
		if (c1.range.to < c2.range.to) return -1;
		return 0;
	};
	
	clear (marks: I.Mark[]) {
		marks.slice().sort(this.sort);
		for (let i = 0; i < marks.length; ++i) {
			let current = marks[i];
			let prev = marks[(i - 1)];
			
			if (!prev) {
				continue;
			};
			
			let del = false;
			
			if (prev.range.to >= current.range.from) {
				marks[(i - 1)].range.to = current.range.to;
				del = true;
			};
			
			if ([ I.MarkType.Link, I.MarkType.TextColor, I.MarkType.BgColor ].indexOf(current.type) >= 0 && !current.param) {
				del = true;
			};
			
			if (del) {
				marks.splice(i, 1);
				i--;
			};
		};
		
		return marks;
	};
	
	checkRanges (text: string, marks: I.Mark[]) {
		for (let i = 0; i < marks.length; ++i) {
			let mark = marks[i];
			let del = false;
			
			if (mark.range.from >= text.length) {
				del = true;
			};
			if (mark.range.to >= text.length) {
				mark.range.to = text.length - 1;
			};
			
			if (del) {
				marks.splice(i, 1);
				i--;	
			};
		};
		return marks;
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
	
	getInRange (marks: I.Mark[], type: number, range: I.TextRange): any {
		let map = this.map(marks);
		if (!map[type] || !map[type].length) {
			return null;
		};
		
		for (let mark of map[type]) {
			let overlap = this.overlap(range, mark.range);
			if ([ Overlap.Inner, Overlap.Equal ].indexOf(overlap) >= 0) {
				return mark;
			};
		};
		return null;
	};
	
	toHtml (text: string, marks: I.Mark[]) {
		if (!marks || !marks.length) {
			return text;
		};
		
		text = String(text || '');
		marks = this.checkRanges(text, marks || []);
		
		let r = text.split('');
		let tag = [ 's', 'kbd', 'i', 'b', 'u', 'a', 'span', 'span' ];
		
		for (let mark of marks) {
			let type = mark.type || 0;
			let t = tag[mark.type];
			let attr = '';
			
			if ((type == I.MarkType.Link) && mark.param) {
				attr = 'href="' + mark.param + '"';
			};
			if ((type == I.MarkType.TextColor) && mark.param) {
				attr = 'style="color:' + mark.param + '"';
			};
			if ((type == I.MarkType.BgColor) && mark.param) {
				attr = 'style="background-color:' + mark.param + '"';
			};
			
			if (r[mark.range.from] && r[mark.range.to - 1]) {
				r[mark.range.from] = '<' + t + (attr ? ' ' + attr : '') + '>' + r[mark.range.from];
				r[mark.range.to - 1] += '</' + t + '>';
			};
		};
		return r.join('');
	};
	
};

export default new Mark();