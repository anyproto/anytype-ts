import $ from 'jquery';
import { I, Preview, Renderer, translate } from 'Lib';
import { popupStore, menuStore } from 'Store';
import Constant from 'json/constant.json';
import Errors from 'json/error.json';
import Text from 'json/text.json';

class UtilCommon {

	history: any = null;

	init (history: any) {
		this.history = history;
	};

	sprintf (...args: any[]) {
		let regex = /%%|%(\d+\$)?([-+#0 ]*)(\*\d+\$|\*|\d+)?(\.(\*\d+\$|\*|\d+))?([scboxXuidfegEG])/g;
		let a = args, i = 0, format = a[i++];
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
			} else 
			if (minWidth == '*') {
				minWidth = +a[i++];
			} else 
			if (minWidth.charAt(0) == '*') {
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
		return s.substring(0, 1).toUpperCase() + s.substring(1, s.length);
	};
	
	toCamelCase (str: string) {
		const s = String(str || '').replace(/[_\-\s]([a-zA-Z]{1})/g, (s: string, p1: string) => {
			return String(p1 || '').toUpperCase();
		});
		return s.substring(0, 1).toLowerCase() + s.substring(1, s.length);
	};

	fromCamelCase (str: string, symbol: string) {
		return str.replace(/([A-Z]{1})/g, (str: string, p1: string) => symbol + p1.toLowerCase());
	};

	ucFirst (s: string): string {
		if (!s) {
			return '';
		};
		return s.substring(0, 1).toUpperCase() + s.substring(1, s.length).toLowerCase();
	};

	objectCopy (o: any): any {
		if (typeof o === 'undefined') {
			o = {};
		};
		return JSON.parse(JSON.stringify(o));
	};
	
	objectLength (o: any) {
		o = o || {};
		return this.hasProperty(o, 'length') ? o.length : Object.keys(o).length;
	};

	hasProperty (o: any, p: string) {
		o = o || {};
		return Object.prototype.hasOwnProperty.call(o, p);
	};

	// Clear object for smaller console output
	objectClear (o: any) {
		for (let k in o) {
			if (typeof o[k] === 'object') {
				o[k] = this.objectClear(o[k]);
				if (!this.objectLength(o[k])) {
					delete(o[k]);
				} else 
				if (this.hasProperty(o[k], 'fieldsMap')){
					o[k] = this.fieldsMap(o[k]['fieldsMap']);
				};
			} else 
			if ((typeof o[k] === 'undefined') || (o[k] === null)) {
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
		
		return (JSON.stringify(k1) === JSON.stringify(k2)) && (JSON.stringify(v1) === JSON.stringify(v2));
	};

	arrayUnique (a: any[]) {
		return [ ...new Set(a) ];
	};
	
	arrayUniqueObjects (a: any[], k: string) {
		const res: any[] = [];
		const map = new Map();
		
		for (const item of a) {
			if (!item) {
				return;
			};
			if (!map.has(item[k])){
				map.set(item[k], true);
				res.push(item);
			};
		};
		return res;
	};

	arrayValues (a: any) {
		return this.hasProperty(a, 'length') ? a : Object.values(a);
	};

	stringCut (haystack: string, start: number, end: number): string {
		return String(haystack || '').substring(0, start) + haystack.substring(end);
	};

	stringInsert (haystack: string, needle: string, start: number, end: number): string {
		haystack = String(haystack || '');
		return haystack.substring(0, start) + needle + haystack.substring(end);
	};
	
	shorten (s: string, l?: number, noEnding?: boolean) {
		s = String(s || '');
		l = Number(l) || 16;
		if (s.length > l) {
			s = s.substring(0, l) + (!noEnding ? '...' : '');
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

	copyToast (label: string, text: string) {
		this.clipboardCopy({ text });
		Preview.toastShow({ text: this.sprintf(translate('toastCopy'), label) });
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

	/** The current time in seconds, rounded down to the nearest second */
	time (): number {
		const date = new Date();
		const timestamp = Math.floor(date.getTime() / 1000);

		return timestamp;
	};

	timestamp (y?: number, m?: number, d?: number, h?: number, i?: number, s?: number): number {
		y = Number(y) || 0;
		m = Number(m) || 0;
		d = Number(d) || 0;
		h = Number(h) || 0;
		i = Number(i) || 0;
		s = Number(s) || 0;

		return Math.floor(new Date(y, m - 1, d, h, i, s, 0).getTime() / 1000);
	};

	today () {
		const t = this.time();
		const d = Number(this.date('d', t));
		const m = Number(this.date('n', t));
		const y = Number(this.date('Y', t));

		return this.timestamp(y, m, d);
	};

	parseDate (value: string, format?: I.DateFormat): number {
		let [ date, time ] = String(value || '').split(' ');
		let d: any = 0;
		let m: any = 0;
		let y: any = 0;
		let h: any = 0;
		let i: any = 0;
		let s: any = 0;

		if (format == I.DateFormat.ShortUS) {
			[ m, d, y ] = String(date || '').split('.');
		} else {
			[ d, m, y ] = String(date || '').split('.');
		};
		[ h, i, s ] = String(time || '').split(':');

		y = Number(y) || 0;
		m = Number(m) || 0;
		d = Number(d) || 0;
		h = Number(h) || 0;
		i = Number(i) || 0;
		s = Number(s) || 0;

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

		const d = new Date((timestamp) * 1000);

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
				return t.substring(0,3);
			},
			j: () => {
				return d.getDate();
			},
			// Month
			F: () => {
				return translate('month' + f.n());
			},
			m: () => {
				return pad(f.n(), 2);
			},
			M: () => {
				return f.F().substring(0, 3);
			},
			n: () => {
				return d.getMonth() + 1;
			},
			// Year
			Y: () => {
				return d.getFullYear();
			},
			y: () => {
				return (d.getFullYear() + '').slice(2);
			},
			// Time
			a: () => {
				return d.getHours() > 11 ? 'pm' : 'am';
			},
			A: () => {
				return d.getHours() > 11 ? 'PM' : 'AM';
			},
			g: () => {
				return d.getHours() % 12 || 12;
			},
			h: () => {
				return pad(f.g(), 2);
			},
			H: () => {
				return pad(d.getHours(), 2);
			},
			i: () => {
				return pad(d.getMinutes(), 2);
			},
			s: () => {
				return pad(d.getSeconds(), 2);
			},
			w: () => {
				return d.getDay();
			},
			N: () => {
				return (f.w() + 6) % 7;
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

	dayString (t: any): string {
		t = Number(t) || 0;

		const ct = this.date('d.m.Y', t);
		const time = this.time();

		if (ct == this.date('d.m.Y', time)) {
			return translate('commonToday');
		};
		if (ct == this.date('d.m.Y', time + 86400)) {
			return translate('commonTomorrow');
		};
		if (ct == this.date('d.m.Y', time - 86400)) {
			return translate('commonYesterday');
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

	/** Merges two unix timestamps, taking the hours/minutes/seconds from the first and the year/month/day from the second */
	mergeTimeWithDate (date: number, time: number) {
		const y = Number(this.date('Y', date));
		const m = Number(this.date('n', date));
		const d = Number(this.date('d', date));

		const h = Number(this.date('H', time));
		const i = Number(this.date('i', time));
		const s = Number(this.date('s', time));
		
		return this.timestamp(y, m, d, h, i, s);
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
		let parts = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 8 }).formatToParts(v);

		if (parts && parts.length) {
			parts = parts.map((it: any) => {
				if (it.type == 'group') {
					it.value = '&thinsp;';
				};
				return it.value;
			});
			ret = parts.join('');
		};
		return ret;
	};

	textStyle (obj: any, param: any) {
		const color = String(obj.css('color') || '').replace(/\s/g, '');
		const rgb = color.match(/rgba?\(([^\(]+)\)/);

		if (!rgb || !rgb.length) {
			return;
		};

		const [ r, g, b ] = rgb[1].split(',');

		obj.css({ 
			borderColor: `rgba(${[ r, g, b, param.border ].join(',')}` 
		});
	};
	
	lbBr (s: string) {
		return s.toString().replace(new RegExp(/\n+/gi), '<br/>');
	};
	
	mapToArray (list: any[], field: string): any {
		list = list|| [] as any[];
		
		let map = {} as any;
		for (let item of list) {
			map[item[field]] = map[item[field]] || [];
			map[item[field]].push(item);
		};
		return map;
	};

	mapToObject (list: any[], field: string) {
        const obj: any = {};
        for (let i = 0; i < list.length; i++) {
            obj[list[i][field]] = list[i];
        };
        return obj;
    };
	
	unmap (map: any) {
		let ret: any[] = [] as any[];
		for (let field in map) {
			ret = ret.concat(map[field]);
		};
		return ret;
	};
	
	regexEscape (v: string) {
		return String(v || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	};

	urlFix (url: string): string {
		url = String(url || '');
		if (!url) {
			return '';
		};

		const scheme = this.getScheme(url);
		if (!scheme) {
			url = 'http://' + url;
		};

		return url;
	};
	
	renderLinks (obj: any) {
		const links = obj.find('a');

		links.off('click auxclick');
		links.on('auxclick', e => e.preventDefault());
		links.click((e: any) => {
			const el = $(e.currentTarget);

			e.preventDefault();
			el.hasClass('path') ? this.onPath(el.attr('href')) : this.onUrl(el.attr('href'));
		});
	};
	
	onUrl (url: string) {
		Renderer.send('urlOpen', url);
	};

	onPath (path: string) {
		Renderer.send('pathOpen', path);
	};
	
	emailCheck (v: string) {
		return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,5})+$/.test(String(v || ''));
	};

	getSelectionRange (): Range {
		let sel: Selection = window.getSelection();
		let range: Range = null;

		if (sel && (sel.rangeCount > 0)) {
			range = sel.getRangeAt(0);
		};

		return range;
	};

	getSelectionRect () {
		let rect: any = { x: 0, y: 0, width: 0, height: 0 };
		let range = this.getSelectionRange();
		if (range) {
			rect = range.getBoundingClientRect() as DOMRect;
		};
		rect = this.objectCopy(rect);

		if (!rect.x && !rect.y && !rect.width && !rect.height) {
			rect = null;
		};

		return rect;
	};

	plural (cnt: any, words: string) {
		const chunks = words.split('|');
		const single = chunks[0];
		const multiple = chunks[1] ? chunks[1] : single;

		cnt = String(cnt || '');

		if (cnt.substr(-2) == 11) {
			return multiple;
		};
		return cnt.substr(-1) == '1' ? single : multiple;
	};

	getPlatform () {
		return Constant.platforms[window.Electron.platform];
	};

	isPlatformMac () {
		return this.getPlatform() == I.Platform.Mac;
	};

	isPlatformWindows () {
		return this.getPlatform() == I.Platform.Windows;
	};

	isPlatformLinux () {
		return this.getPlatform() == I.Platform.Linux;
	};

	checkError (code: number): boolean {
		if (!code) {
			return true;
		};

		// App is already working
		if (code == Errors.Code.ANOTHER_ANYTYPE_PROCESS_IS_RUNNING) {
			alert('You have another instance of anytype running on this machine. Closing...');
			Renderer.send('exit', false);
			return false;
		};

		// App needs update
		if ([ Errors.Code.ANYTYPE_NEEDS_UPGRADE, Errors.Code.PROTOCOL_NEEDS_UPGRADE ].includes(code)) {
			this.onErrorUpdate();
			return false;
		};

		return true;
	};

	onErrorUpdate (onConfirm?: () => void) {
		popupStore.open('confirm', {
			data: {
				icon: 'update',
				title: translate('confirmUpdateTitle'),
				text: translate('confirmUpdateText'),
				textConfirm: translate('confirmUpdateConfirm'),
				canCancel: false,
				onConfirm: () => {
					Renderer.send('update');
					if (onConfirm) {
						onConfirm();
					};
				},
			},
		});
	};

	getScheme (url: string): string {
		url = String(url || '');
		return url.indexOf('://') >= 0 ? String(url.split('://')[0] || '') : '';
	};

	getRoute (path: string): { page: string, action: string, id: string } {
		let route = path.split('/');
		route.shift();

		const page = String(route[0] || 'index');
		const action = String(route[1] || 'index');
		const id = String(route[2] || '');

		return { page, action, id };
	};

	route (route: string, param: Partial<{ replace: boolean, animate: boolean }>) {
		const { replace, animate } = param;
		const method = replace ? 'replace' : 'push';

		let timeout = menuStore.getTimeout(menuStore.getItems());
		if (!timeout) {
			timeout = popupStore.getTimeout(popupStore.getItems());
		};

		menuStore.closeAll();
		popupStore.closeAll();

		window.setTimeout(() => {
			Preview.hideAll();

			if (animate) {
				const fade = $('#globalFade');
				
				fade.show();
				window.setTimeout(() => fade.addClass('show'), 15);

				window.setTimeout(() => {
					this.history[method](route); 
					fade.removeClass('show');

					window.setTimeout(() => fade.hide(), Constant.delay.route);
				}, Constant.delay.route);
			} else {
				this.history[method](route); 
			};
		}, timeout);
	};

	intercept (obj: any, change: any) {
		return JSON.stringify(change.newValue) === JSON.stringify(obj[change.name]) ? null : change;
	};

	getScrollContainer (isPopup: boolean) {
		return (isPopup ? $('#popupPage-innerWrap') : $(window)) as JQuery<HTMLElement>;
	};

	getPageContainer (isPopup: boolean) {
		return $(isPopup ? '#popupPage-innerWrap' : '#page.isFull');
	};

	getBodyContainer (type: string) {
		switch (type) {
			default:
			case 'page':
				return 'body';

			case 'popup':
				return '#popupPage-innerWrap';
			
			case 'menuBlockAdd':
				return `#${type} .content`;

			case 'menuBlockRelationView':
				return `#${type} .scrollWrap`;
		};
	};

	getCellContainer (type: string) {
		switch (type) {
			default:
			case 'page':
				return '#page.isFull';

			case 'popup':
				return '#popupPage-innerWrap';

			case 'menuBlockAdd':
			case 'menuBlockRelationView':
				return '#' + type;
		};
	};

	sizeHeader (): number {
		return this.isPlatformWindows() ? 38 : 52;
	};

	searchParam (url: string): any {
		const a = url.replace(/^\?/, '').split('&');
		const param: any = {};
		
		a.forEach((s) => {
			const [ key, value ] = s.split('=');
			param[key] = value;
		});
		return param;
	};

	addBodyClass (prefix: string, v: string) {
		const obj = $('html');
		const reg = new RegExp(`^${prefix}`);
		const c = String(obj.attr('class') || '').split(' ').filter(it => !it.match(reg));

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

	
	rectsCollide (rect1: any, rect2: any) {
		return this.coordsCollide(rect1.x, rect1.y, rect1.width, rect1.height, rect2.x, rect2.y, rect2.width, rect2.height);
	};
	
	coordsCollide (x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number) {
		return !((y1 + h1 < y2) || (y1 > y2 + h2) || (x1 + w1 < x2) || (x1 > x2 + w2));
	};

	matchUrl (url: string) {
		const reg = new RegExp(/^((?:[a-z]+:(?:\/\/)?)|\/\/)([^\s\/\?#]+)([^\s\?#]+)(?:\?([^#\s]*))?(?:#([^\s]*))?$/gi);
		return url.match(reg);
	};

	getDataTransferFiles (items: any[]): any[] {
		if (!items || !items.length) {
			return [];
		};

		const files: any[] = [];
		for (let item of items) {
			if (item.kind != 'file') {
				continue;
			};

			const file = item.getAsFile();
			if (file) {
				files.push(file);
			};
		};
		return files;
	};

	getDataTransferItems (items: any[]) {
		if (!items || !items.length) {
			return [];
		};

		let ret = [];
		for (let item of items) {
			if ((item.kind == 'string') && (item.type == 'text/html')) {
				ret.push(item);
			};
		};
		return ret;
	};

	getDataTransferString (items: any[], callBack: (data: string) => void) {
		if (!items || !items.length) {
			return;
		};

		const length = items.length;
		const ret = [];
		const cb = (data: string) => {
			ret.push(data);

			if (ret.length == length) {
				callBack(ret.join('\n'));
			};
		};

		for (let item of items) {
			item.getAsString(cb);
		};
	};

	saveClipboardFiles (items: any[], data: any, callBack: (data: any) => void) {
		if (!items.length) {
			return;
		};

		let ret: any[] = [];
		let n = 0;
		let cb = () => {
			n++;
			if (n == items.length) {
				callBack({ ...data, files: ret });
			};
		};

		for (let item of items) {
			if (item.path) {
				ret.push({ name: item.name, path: item.path });
				cb();
			} else {
				const reader = new FileReader();
				reader.onload = () => {
					ret.push({ 
						name: item.name, 
						path: window.Electron.fileWrite(item.name, reader.result, 'binary'),
					});
					cb();
				};
				reader.onerror = cb;
				reader.readAsBinaryString(item);
			};
		};
	};

	dataProps (data: any) {
		data = data || {};

		const ret: any = {};
		for (const k in data) {
			ret['data-' + k] = data[k];
		};
		return ret;
	};

	shortUrl (url: string) {
		let a: any = {};
		try { a = new URL(url); } catch (e) {};
		return a.hostname || url;
	};

	pauseMedia () {
		$('audio, video').each((i: number, item: any) => { item.pause(); });
	};

	getPercentage (num: number, percent: number) {
		return Number((num / 100 * percent).toFixed(3));
	};

	getEventNamespace (isPopup: boolean): string {
		return isPopup ? '-popup' : '';
	};

	triggerResizeEditor (isPopup: boolean) {
		$(window).trigger('resize.editor' + this.getEventNamespace(isPopup));
	};

	/**
	 * Get width and height of window DOM node
	 */
	getWindowDimensions (): { ww: number; wh: number } {
		const win = $(window);
		return { ww: win.width(), wh: win.height() };
	};

	getPercent (part: number, whole: number): number {
		return Number((part / whole * 100).toFixed(1));
	};

	translateError (command: string, error: any) {
		const { code, description } = error;
		const id = this.toCamelCase(`error-${command}${code}`);

		return Text[id] ? translate(id) : description;
	};

};

export default new UtilCommon();
