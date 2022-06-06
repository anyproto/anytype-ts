import { I, keyboard } from 'ts/lib';
import { commonStore, popupStore, menuStore } from 'ts/store';
import { translate } from '.';

const raf = require('raf');
const $ = require('jquery');
const fs = window.require('fs');
const Constant = require('json/constant.json');
const Errors = require('json/error.json');
const os = window.require('os');
const path = window.require('path');
const Cover = require('json/cover.json');

class Util {

	history: any = null;

	init (history: any) {
		this.history = history;
	};
	
	timeoutTooltip: number = 0;
	timeoutPreviewShow: number = 0;
	timeoutPreviewHide: number = 0;
	isPreviewOpen: boolean = false;

	sprintf (...args: any[]) {
		let regex = /%%|%(\d+\$)?([-+#0 ]*)(\*\d+\$|\*|\d+)?(\.(\*\d+\$|\*|\d+))?([scboxXuidfegEG])/g;
		let a = arguments, i = 0, format = a[i++];
		let pad = function (str, len, chr, leftJustify) {
			let padding = (str.length >= len) ? '' : Array(1 + len - str.length >>> 0).join(chr);
			return leftJustify ? str + padding : padding + str;
		};

		let justify = function (value, prefix, leftJustify, minWidth, zeroPad) {
			let diff = minWidth - value.length;
			if (diff > 0) {
				if (leftJustify || !zeroPad) {
					value = pad(value, minWidth, ' ', leftJustify);
				} else {
					value = value.slice(0, prefix.length) + pad('', diff, '0', true) + value.slice(prefix.length);
				};
			};
			return value;
		};

		let formatBaseX = function (value, base, prefix, leftJustify, minWidth, precision, zeroPad) {
			let number = value >>> 0;
			prefix = prefix && number && {'2': '0b', '8': '0', '16': '0x'}[base] || '';
			value = prefix + pad(number.toString(base), precision || 0, '0', false);
			return justify(value, prefix, leftJustify, minWidth, zeroPad);
		};
		
		let formatString = function (value, leftJustify, minWidth, precision, zeroPad) {
			if (precision != null) {
				value = value.slice(0, precision);
			};
			return justify(value, '', leftJustify, minWidth, zeroPad);
		};
		
		let doFormat = function (substring, valueIndex, flags, minWidth, _, precision, type) {
			if (substring == '%%') return '%';
			let leftJustify = false, positivePrefix = '', zeroPad = false, prefixBaseX = false;
			for (let j = 0; flags && j < flags.length; j++) switch (flags.charAt(j)) {
				case ' ': positivePrefix = ' '; break;
				case '+': positivePrefix = '+'; break;
				case '-': leftJustify = true; break;
				case '0': zeroPad = true; break;
				case '#': prefixBaseX = true; break;
			};
		
			if (!minWidth) {
				minWidth = 0;
			} else if (minWidth == '*') {
				minWidth = +a[i++];
			} else if (minWidth.charAt(0) == '*') {
				minWidth = +a[minWidth.slice(1, -1)];
			} else {
				minWidth = +minWidth;
			};
		
			if (minWidth < 0) {
				minWidth = -minWidth;
				leftJustify = true;
			};
		
			if (!isFinite(minWidth)) {
				throw new Error('sprintf: (minimum-)width must be finite');
			};
		
			if (!precision) {
				precision = 'fFeE'.indexOf(type) > -1 ? 6 : (type == 'd') ? 0 : void(0);
			} else if (precision == '*') {
				precision = +a[i++];
			} else if (precision.charAt(0) == '*') {
				precision = +a[precision.slice(1, -1)];
			} else {
				precision = +precision;
			};
		
			let value: any = valueIndex ? a[valueIndex.slice(0, -1)] : a[i++];
		
			switch (type) {
				case 's': return formatString(String(value), leftJustify, minWidth, precision, zeroPad);
				case 'c': return formatString(String.fromCharCode(+value), leftJustify, minWidth, precision, zeroPad);
				case 'b': return formatBaseX(value, 2, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
				case 'o': return formatBaseX(value, 8, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
				case 'x': return formatBaseX(value, 16, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
				case 'X': return formatBaseX(value, 16, prefixBaseX, leftJustify, minWidth, precision, zeroPad).toUpperCase();
				case 'u': return formatBaseX(value, 10, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
				case 'i':
				case 'd': {
					let number = +value;
					number = parseInt(String(number));
					let prefix = number < 0 ? '-' : positivePrefix;
					value = prefix + pad(String(Math.abs(number)), precision, '0', false);
					return justify(value, prefix, leftJustify, minWidth, zeroPad);
				};
				case 'e':
				case 'E':
				case 'f':
				case 'F':
				case 'g':
				case 'G': {
					let number = +value;
					let prefix = number < 0 ? '-' : positivePrefix;
					let method = ['toExponential', 'toFixed', 'toPrecision']['efg'.indexOf(type.toLowerCase())];
					let textTransform = ['toString', 'toUpperCase']['eEfFgG'.indexOf(type) % 2];

					value = prefix + Math.abs(number)[method](precision);
					return justify(value, prefix, leftJustify, minWidth, zeroPad)[textTransform]();
				};
				default: return substring;
			}
		};
		
		return format.replace(regex, doFormat);
	};
	
	toUpperCamelCase (str: string) {
		const s = this.toCamelCase(str);
		return s.substr(0, 1).toUpperCase() + s.substr(1, s.length);
	};
	
	toCamelCase (str: string) {
		const s = str.replace(/[_\-\s]([a-zA-Z]{1})/g, (s: string, p1: string) => {
			return String(p1 || '').toUpperCase();
		});
		return s.substr(0, 1).toLowerCase() + s.substr(1, s.length);
	};

	fromCamelCase (str: string, symbol: string) {
		return str.replace(/([A-Z]{1})/g, (str: string, p1: string, p2: string, offset: number, s: string) => {
			return symbol + p1.toLowerCase();
		});
	};

	ucFirst (s: string): string {
		if (!s) {
			return '';
		};
		return s.substr(0, 1).toUpperCase() + s.substr(1, s.length).toLowerCase();
	};

	objectCopy (o: any): any {
		return JSON.parse(JSON.stringify(o || {}));
	};
	
	objectLength (o: any) {
		return o.hasOwnProperty('length') ? o.length : Object.keys(o).length;
	};

	// Clear object for smaller console output
	objectClear (o: any) {
		for (let k in o) {
			if ('object' == typeof(o[k])) {
				o[k] = this.objectClear(o[k]);
				if (!this.objectLength(o[k])) {
					delete(o[k]);
				} else 
				if (o[k].hasOwnProperty('fieldsMap')){
					o[k] = this.fieldsMap(o[k]['fieldsMap']);
				};
			} else 
			if (('undefined' == typeof(o[k])) || (o[k] === null)) {
				delete(o[k]);
			};
		};
		return o;
	};

	fieldsMap (a: any[]) {
		let o = {};
		for (let i = 0; i < a.length; ++i) {
			if ((a[i].constructor === Array) && (a[i].length == 2)) {
				let value = a[i][1];
				let v = '';

				for (let k in value) {
					if (value[k]) {
						v = value[k];
						break;
					};
				};

				o[a[i][0]] = v;
			};
		};
		if ((a.length) <= 3) {
			return JSON.stringify(o);
		};
		return o;
	};

	objectCompare (o1: any, o2: any): boolean {
		o1 = o1 || {};
		o2 = o2 || {};
		
		let k1 = Object.keys(o1);
		let k2 = Object.keys(o2);
		let v1 = Object.values(o1);
		let v2 = Object.values(o2);
		let sort = (c1: any, c2: any) => {
			if (c1 > c2) return 1;
			if (c1 < c2) return -1;
			return 0;
		};
		
		k1.sort(sort);
		k2.sort(sort);
		v1.sort(sort);
		v2.sort(sort);
		
		return (JSON.stringify(k1) === JSON.stringify(k2)) && 
			(JSON.stringify(v1) === JSON.stringify(v2));
	};

	arrayUnique (a: any[]) {
		return [ ...new Set(a) ];
	};
	
	arrayUniqueObjects (a: any[], k: string) {
		const res: any[] = [];
		const map = new Map();
		
		for (const item of a) {
			if (!map.has(item[k])){
				map.set(item[k], true);
				res.push(item);
			};
		};
		return res;
	};

	arrayValues (a: any) {
		return a.hasOwnProperty('length') ? a : Object.values(a);
	};

	stringCut (haystack: string, start: number, end: number): string {
		return String(haystack || '').substr(0, start) + haystack.substr(end);
	};

	stringInsert (haystack: string, needle: string, start: number, end: number): string {
		haystack = String(haystack || '');
		return haystack.substr(0, start) + needle + haystack.substr(end);
	};
	
	shorten (s: string, l?: number, noEnding?: boolean) {
		s = String(s || '');
		l = Number(l) || 16;
		if (s.length > l) {
			s = s.substr(0, l) + (!noEnding ? '...' : '');
		};
		return s;
	};

	clipboardCopy (data: any, callBack?: () => void) {
		const handler = (e: any) => {
			e.preventDefault();
			
			if (data.text) {
				e.clipboardData.setData('text/plain', data.text);
			};
			if (data.html) {
				e.clipboardData.setData('text/html', data.html);	
			};
			if (data.anytype) {
				e.clipboardData.setData('application/json', JSON.stringify(data.anytype));
			};
			
			document.removeEventListener('copy', handler, true);
			
			if (callBack) {
				callBack();
			};
		};

		document.addEventListener('copy', handler, true);
		document.execCommand('copy');
	};
	
	cacheImages (images: string[], callBack?: () => void) {
		let loaded = 0;
		let cb = () => {
			loaded++;
			if ((loaded == images.length) && callBack) {
				callBack();
			};
		};

		images.forEach(image => {
			const img = new Image();

			img.src = image;
			img.onload = cb;
			img.onerror = cb;
		});
	};
	
	rand (min: number, max: number): number {
		if (max && (max != min)) {
			return Math.floor(Math.random() * (max - min + 1)) + min;
		} else {
			return Math.floor(Math.random() * (min + 1));
		};
	};

	time () {
		let timestamp = Math.floor((new Date()).getTime() / 1000);
		let timezone = commonStore.timezoneGet();

		return timestamp + timezone.offset;
	};

	timestamp (y?: number, m?: number, d?: number, h?: number, i?: number, s?: number): number {
		y = Number(y) || 0;
		m = Number(m) || 0;
		d = Number(d) || 0;
		h = Number(h) || 0;
		i = Number(i) || 0;
		s = Number(s) || 0;

		let timestamp = Math.floor(Date.UTC(y, m - 1, d, h, i, s, 0) / 1000);
		let timezone = commonStore.timezoneGet();

		return timestamp - timezone.offset;
	};

	parseDate (value: string, format?: I.DateFormat): number {
		let [ date, time ] = String(value || '').split(' ');
		let d = 0;
		let m = 0;
		let y = 0;

		if (format == I.DateFormat.ShortUS) {
			[ m, d, y ] = String(date || '').split('.').map((it: any) => { return Number(it) || 0; });
		} else {
			[ d, m, y ] = String(date || '').split('.').map((it: any) => { return Number(it) || 0; });
		};
		let [ h, i, s ] = String(time || '').split(':').map((it: any) => { return Number(it) || 0; });

		m = Math.min(12, Math.max(1, m));
		let maxDays = Constant.monthDays[m];
		if ((m == 2) && (y % 4 === 0)) {
			maxDays = 29;
		};
		d = Math.min(maxDays, Math.max(1, d));
		h = Math.min(24, Math.max(0, h));
		i = Math.min(60, Math.max(0, i));
		s = Math.min(60, Math.max(0, s));

		return this.timestamp(y, m, d, h, i, s);
	};

	date (format: string, timestamp: number) {
		timestamp = Number(timestamp) || 0;

		const timezone = commonStore.timezoneGet();
		const d = new Date((timestamp + timezone.offset) * 1000);

		const pad = (n: number, c: number) => {
			let s = String(n);
			if ((s = s + '').length < c ) {
				++c;
				let m = c - s.length;
				return new Array(m).join('0') + s;
			} else {
				return s;
			};
		};

		const f: any = {
			// Day
			d: () => {
			   return pad(f.j(), 2);
			},
			D: () => {
				let t = f.l(); 
				return t.substr(0,3);
			},
			j: () => {
				return d.getUTCDate();
			},
			// Month
			F: () => {
				return translate('month' + f.n());
			},
			m: () => {
				return pad(f.n(), 2);
			},
			M: () => {
				return f.F().substr(0, 3);
			},
			n: () => {
				return d.getUTCMonth() + 1;
			},
			// Year
			Y: () => {
				return d.getUTCFullYear();
			},
			y: () => {
				return (d.getUTCFullYear() + '').slice(2);
			},
			// Time
			a: () => {
				return d.getUTCHours() > 11 ? 'pm' : 'am';
			},
			A: () => {
				return d.getUTCHours() > 11 ? 'PM' : 'AM';
			},
			g: () => {
				return d.getUTCHours() % 12 || 12;
			},
			h: () => {
				return pad(f.g(), 2);
			},
			H: () => {
				return pad(d.getUTCHours(), 2);
			},
			i: () => {
				return pad(d.getUTCMinutes(), 2);
			},
			s: () => {
				return pad(d.getUTCSeconds(), 2);
			},
			w: () => {
				return d.getUTCDay();
			},
		};
		return format.replace(/[\\]?([a-zA-Z])/g, (t: string, s: string) => {
			let ret = null;
			if (t != s) {
				ret = s;
			} else if (f[s]) {
				ret = f[s]();
			} else {
				ret = s;
			};
			return ret;
		});
	};

	day (t: any): string {
		t = Number(t) || 0;

		const ct = this.date('d.m.Y', t);
		if (ct == this.date('d.m.Y', this.time())) {
			return 'Today';
		};
		if (ct == this.date('d.m.Y', this.time() + 86400)) {
			return 'Tomorrow';
		};
		if (ct == this.date('d.m.Y', this.time() - 86400)) {
			return 'Yesterday';
		};
		return '';
	};

	timeAgo (t: number): string {
		if (!t) {
			return '';
		};

		let delta = this.time() - t;
		let d = Math.floor(delta / 86400);

		delta -= d * 86400;
		let h = Math.floor(delta / 3600);

		delta -= h * 3600;
		let m = Math.floor(delta / 60);

		delta -= m * 60;
		let s = delta;

		if (d > 0) {
			return this.sprintf('%d days ago', d);
		};
		if (h > 0) {
			return this.sprintf('%d hours ago', h);
		};
		if (m > 0) {
			return this.sprintf('%d minutes ago', m);
		};
		if (s > 0) {
			return this.sprintf('%d seconds ago', s);
		};
		return '';
	};

	duration (t: number): string {
		if (!t) {
			return '';
		};

		let d = Math.floor(t / 86400);

		t -= d * 86400;
		let h = Math.floor(t / 3600);

		t -= h * 3600;
		let m = Math.floor(t / 60);

		t -= m * 60;
		let s = t;

		if (d > 0) {
			return this.sprintf('%dd', d);
		};
		if (h > 0) {
			return this.sprintf('%dh', h);
		};
		if (m > 0) {
			return this.sprintf('%dmin', m);
		};
		if (s > 0) {
			return this.sprintf('%ds', s);
		};
		return '';
	};
	
	round (v: number, l: number) {
		let d = Math.pow(10, l);
		return d > 0 ? Math.round(v * d) / d : Math.round(v);
	};

	formatNumber (v: number): string {
		v = Number(v) || 0;

		let ret = String(v || '');
		let parts = new Intl.NumberFormat('en-GB').formatToParts(v);
					
		if (parts && parts.length) {
			parts = parts.map((it: any) => {
				if (it.value == ',') {
					it.value = '&thinsp;';
				};
				return it.value;
			});
			ret = parts.join('');
		};
		return ret;
	};
	
	tooltipShow (text: string, node: any, typeX: I.MenuDirection, typeY: I.MenuDirection) {
		if (!node.length || keyboard.isResizing) {
			return;
		};

		window.clearTimeout(this.timeoutTooltip);
		this.timeoutTooltip = window.setTimeout(() => {
			let win = $(window);
			let obj = $('#tooltip');
			let offset = node.offset();
			let st = win.scrollTop(); 
			let nw = node.outerWidth();
			let nh = node.outerHeight();

			text = text.toString().replace(/\\n/, '\n');
			
			obj.find('.txt').html(this.lbBr(text));
			obj.show().css({ opacity: 0 });
			
			let ow = obj.outerWidth();
			let oh = obj.outerHeight();
			let x = 0;
			let y = 0;

			switch (typeX) {
				case I.MenuDirection.Left:
					x = offset.left;
					break;

				default:
				case I.MenuDirection.Center:
					x = offset.left - ow / 2 + nw / 2;
					break;

				case I.MenuDirection.Right:
					x = offset.left + ow - nw;
					break;
			};

			switch (typeY) {
				default:
				case I.MenuDirection.Top:
					y = offset.top - oh - 6 - st;
					break;
				
				case I.MenuDirection.Bottom:
					y = offset.top + nh + 6 - st;
					break;
			};
			
			x = Math.max(12, x);
			x = Math.min(win.width() - obj.outerWidth() - 12, x);

			raf(() => {
				obj.css({ left: x, top: y, opacity: 1 });
			});
		}, 250);
	};
	
	tooltipHide (force: boolean) {
		let obj = $('#tooltip');
		
		obj.css({ opacity: 0 });
		window.clearTimeout(this.timeoutTooltip);
		this.timeoutTooltip = window.setTimeout(() => { obj.hide(); }, force ? 0 : Constant.delay.tooltip);
	};
	
	previewShow (node: any, param: any) {
		if (!node.length || keyboard.isPreviewDisabled) {
			return;
		};
		
		const obj = $('#preview');
		
		node.unbind('mouseleave.link').on('mouseleave.link', (e: any) => {
			window.clearTimeout(this.timeoutPreviewShow);
		});
		
		obj.unbind('mouseleave.link').on('mouseleave.link', (e: any) => {
			this.previewHide(false);
		});
		
		this.previewHide(false);
		
		window.clearTimeout(this.timeoutPreviewShow);
		this.timeoutPreviewShow = window.setTimeout(() => {
			this.isPreviewOpen = true;
			commonStore.previewSet({ ...param, element: node });
		}, 500);
	};
	
	previewHide (force: boolean) {
		this.isPreviewOpen = false;
		window.clearTimeout(this.timeoutPreviewShow);

		const obj = $('#preview');
		if (force) {
			obj.hide();
			return;
		};
		
		obj.css({ opacity: 0 });
		this.timeoutPreviewHide = window.setTimeout(() => { 
			obj.hide();
			obj.removeClass('top bottom withImage'); 

			commonStore.previewClear();
		}, 250);
	};
	
	lbBr (s: string) {
		return s.toString().replace(new RegExp(/\n+/gi), '<br/>');
	};
	
	map (list: any[], field: string): any {
		list = list|| [] as any[];
		
		let map = {} as any;
		for (let item of list) {
			map[item[field]] = map[item[field]] || [];
			map[item[field]].push(item);
		};
		return map;
	};
	
	unmap (map: any) {
		let ret: any[] = [] as any[];
		for (let field in map) {
			ret = ret.concat(map[field]);
		};
		return ret;
	};
	
	filterFix (v: string) {
		return String(v || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	};
	
	lengthFixOut (text: string, len: number): number {
		const s = String(text || '').substring(0, len);
		return [...s].length;
	};
	
	// Fix emoji lengths for GO
	rangeFixOut (text: string, range: I.TextRange): I.TextRange {
		range = this.objectCopy(range);
		range.from = this.lengthFixOut(text, range.from);
		range.to = this.lengthFixOut(text, range.to);
		return range;
	};
	
	renderLink (obj: any) {
		const renderer = this.getRenderer();

		obj.find('a').unbind('click').on('click', function (e: any) {
			e.preventDefault();
			renderer.send('urlOpen', $(this).attr('href'));
		});
	};

	renderLinks (obj: any) {
		const self = this;

		obj.find('a').unbind('click').click(function (e: any) {
			e.preventDefault();
			const el = $(this);

			if (el.hasClass('path')) {
				self.onPath(el.attr('href'));
			} else {
				self.onUrl(el.attr('href'));
			};
		});
	};
	
	onUrl (url: string) {
		const renderer = this.getRenderer();

		renderer.send('urlOpen', url);
	};

	onPath (path: string) {
		const renderer = this.getRenderer();

		renderer.send('pathOpen', path);
	};
	
	emailCheck (v: string) {
		return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,5})+$/.test(String(v || ''));
	};

	isNumber (s: string) {
		return String((Number(s) || 0) || '') === String(s || '');
	};

	coverSrc (id: string, preview?: boolean): string {
		const item = Cover.find((it: any) => { return it.id == id; });
		if (item) {
			return commonStore.imageUrl(item.hash, preview ? 200 : Constant.size.image);
		};
		return `./img/cover/${preview ? 'preview/' : ''}${id}.jpg`;
	};

	selectionRange (): Range {
		let sel: Selection = window.getSelection();
		let range: Range = null;

		if (sel && (sel.rangeCount > 0)) {
			range = sel.getRangeAt(0);
		};

		return range;
	};

	selectionRect () {
		let rect: any = { x: 0, y: 0, width: 0, height: 0 };
		let range = this.selectionRange();
		if (range) {
			rect = range.getBoundingClientRect() as DOMRect;
		};
		rect = this.objectCopy(rect);

		if (!rect.x && !rect.y && !rect.width && !rect.height) {
			rect = null;
		};

		return rect;
	};

	cntWord (cnt: any, w1: string, w2?: string) {
		cnt = String(cnt || '');
		w2 = w2 ? w2 : w1 + 's';
		if (cnt.substr(-2) == 11) {
			return w2;
		};
		return cnt.substr(-1) == '1' ? w1 : w2;
	};

	getPlatform () {
		return Constant.platforms[os.platform()];
	};

	checkError (code: number) {
		if (!code) {
			return;
		};

		const renderer = this.getRenderer();

		// App is already working
		if (code == Errors.Code.ANOTHER_ANYTYPE_PROCESS_IS_RUNNING) {
			alert('You have another instance of anytype running on this machine. Closing...');
			renderer.send('exit', false);
		};

		// App needs update
		if (code == Errors.Code.ANYTYPE_NEEDS_UPGRADE) {
			this.onErrorUpdate();
		};
	};

	onErrorUpdate (onConfirm?: () => void) {
		const renderer = this.getRenderer();

		popupStore.open('confirm', {
			data: {
				icon: 'update',
				title: translate('confirmUpdateTitle'),
				text: translate('confirmUpdateText'),
				textConfirm: translate('confirmUpdateConfirm'),
				canCancel: false,
				onConfirm: () => {
					renderer.send('update');
					if (onConfirm) {
						onConfirm();
					};
				},
			},
		});
	};

	getScheme (url: string): string {
		const a = String(url || '').split('://');
		return String(a[0] || '');
	};

	getRoute (path: string): { page: string, action: string, id: string } {
		let route = path.split('/');
		route.shift();

		const page = String(route[0] || 'index');
		const action = String(route[1] || 'index');
		const id = String(route[2] || '');

		return { page, action, id };
	};

	route (route: string, replace?: boolean) {
		const method = replace ? 'replace' : 'push';

		this.tooltipHide(true);
		this.previewHide(true);

		menuStore.closeAll();
		popupStore.closeAll(null, () => { this.history[method](route); });
	};

	intercept (obj: any, change: any) {
		return JSON.stringify(change.newValue) === JSON.stringify(obj[change.name]) ? null : change;
	};

	getScrollContainer (isPopup: boolean) {
		return $(isPopup ? '#popupPage #innerWrap' : window);
	};

	getBodyContainer (type: string) {
		switch (type) {
			default:
			case 'page':
				return 'body';

			case 'popup':
				return '#popupPage #innerWrap';
			
			case 'menuBlockAdd':
				return `#${type} .content`;

			case 'menuBlockRelationView':
				return `#${type} .scrollWrap`;
		};
	};

	getPageContainer (type: string) {
		switch (type) {
			default:
			case 'page':
				return '#page.isFull';

			case 'popup':
				return '#popupPage';

			case 'menuBlockAdd':
			case 'menuBlockRelationView':
				return '#' + type;
		};
	};

	sizeHeader (): number {
		return this.getPlatform() == I.Platform.Windows ? 68 : 52;
	};

	deleteFolderRecursive (p: string) {
		if (!fs.existsSync(p) ) {
			return;
		};

		fs.readdirSync(p).forEach((file: any) => {
			const cp = path.join(p, file);
			if (fs.lstatSync(cp).isDirectory()) {
				this.deleteFolderRecursive(cp);
			} else {
				fs.unlinkSync(cp);
			};
		});
		fs.rmdirSync(p);
	};

	searchParam (url: string): any {
		var a = url.replace(/^\?/, '').split('&');
		var param: any = {};
		
		a.forEach((s) => {
			var kv = s.split('=');
			param[kv[0]] = kv[1];
		});

		return param;
	};

	addBodyClass (prefix: string, v: string) {
		const obj = $('html');
		const reg = new RegExp(`^${prefix}`);
		const c = String(obj.attr('class') || '').split(' ').filter((it: string) => { return !it.match(reg); });

		if (v) {
			c.push(this.toCamelCase(`${prefix}-${v}`));
		};

		obj.attr({ class: c.join(' ') });
	};

	findClosestElement (array: number[], goal: number) {
		return array.reduce((prev: number, curr: number) => {
			return Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev;
		});
	};

	getRenderer () {
		const electron: any = window.require('electron') || {};
		return electron.ipcRenderer || window.Renderer;
	};
	
	resizeSidebar () {
		const { sidebar } = commonStore;
		const { fixed, snap } = sidebar;

		const win = $(window);
		const obj = $('#sidebar');
		const page = $('#page.isFull');
		const header = page.find('#header');
		const footer = page.find('#footer');
		const loader = page.find('#loader');
		
		const width = fixed ? obj.width() : 0;
		const pw = win.width() - width - 1;
		const css: any = { width: '' };
		const cssLoader: any = { width: pw, left: '', right: '' };

		let dummy = $('.sidebarDummy');

		header.css(css).removeClass('withSidebar snapLeft snapRight');
		footer.css(css).removeClass('withSidebar snapLeft snapRight');
		dummy.css(css);

		if (!obj.length) {
			return;
		};

		if (fixed) {
			header.addClass('withSidebar');
			footer.addClass('withSidebar');
		};
		css.width = header.outerWidth() - width - 1;
		
		if (snap !== null) {
			if (snap == I.MenuDirection.Right) {
				dummy = $('.sidebarDummy.right');
				header.addClass('snapRight');
				footer.addClass('snapRight');

				cssLoader.left = 0;
				cssLoader.right = '';
			} else {
				dummy = $('.sidebarDummy.left');
				header.addClass('snapLeft');
				footer.addClass('snapLeft');

				cssLoader.left = '';
				cssLoader.right = 0;
			};
		};

		dummy.css({ width });
		page.css({ width: pw });
		loader.css(cssLoader);
		header.css(css);
		footer.css(css);
	};

	rectsCollide (rect1: any, rect2: any) {
		return this.coordsCollide(rect1.x, rect1.y, rect1.width, rect1.height, rect2.x, rect2.y, rect2.width, rect2.height);
	};
	
	coordsCollide (x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number) {
		return !((y1 + h1 < y2) || (y1 > y2 + h2) || (x1 + w1 < x2) || (x1 > x2 + w2));
	};

};

export default new Util();