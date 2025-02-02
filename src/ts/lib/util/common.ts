import $ from 'jquery';
import DOMPurify from 'dompurify';
import { I, C, S, J, U, Preview, Renderer, translate, Mark, Action, sidebar } from 'Lib';

const TEST_HTML = /<[^>]*>/;

class UtilCommon {

	getElectron () {
		return window.Electron || {};
	};

	getCurrentElectronWindowId (): string {
		const electron = this.getElectron();

		if (!electron) {
			return '0';
		};

		return String(electron.currentWindow().windowId || '');
	};

	getGlobalConfig () {
		return window.AnytypeGlobalConfig || {};
	};

	sprintf (...args: any[]) {
		const regex = /%%|%(\d+\$)?([-+#0 ]*)(\*\d+\$|\*|\d+)?(\.(\*\d+\$|\*|\d+))?([scboxXuidfegEG])/g;
		const a = args;

		let i = 0;

		const format = a[i++];
		const pad = function (str, len, chr, leftJustify) {
			const padding = (str.length >= len) ? '' : Array(1 + len - str.length >>> 0).join(chr);
			return leftJustify ? str + padding : padding + str;
		};

		const justify = function (value, prefix, leftJustify, minWidth, zeroPad) {
			const diff = minWidth - value.length;
			if (diff > 0) {
				if (leftJustify || !zeroPad) {
					value = pad(value, minWidth, ' ', leftJustify);
				} else {
					value = value.slice(0, prefix.length) + pad('', diff, '0', true) + value.slice(prefix.length);
				};
			};
			return value;
		};

		const formatBaseX = function (value, base, prefix, leftJustify, minWidth, precision, zeroPad) {
			const number = value >>> 0;
			prefix = prefix && number && {'2': '0b', '8': '0', '16': '0x'}[base] || '';
			value = prefix + pad(number.toString(base), precision || 0, '0', false);
			return justify(value, prefix, leftJustify, minWidth, zeroPad);
		};
		
		const formatString = function (value, leftJustify, minWidth, precision, zeroPad) {
			if (precision != null) {
				value = value.slice(0, precision);
			};
			return justify(value, '', leftJustify, minWidth, zeroPad);
		};
		
		const doFormat = function (substring, valueIndex, flags, minWidth, _, precision, type) {
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
					const prefix = number < 0 ? '-' : positivePrefix;
					value = prefix + pad(String(Math.abs(number)), precision, '0', false);
					return justify(value, prefix, leftJustify, minWidth, zeroPad);
				};
				case 'e':
				case 'E':
				case 'f':
				case 'F':
				case 'g':
				case 'G': {
					const number = +value;
					const prefix = number < 0 ? '-' : positivePrefix;
					const method = ['toExponential', 'toFixed', 'toPrecision']['efg'.indexOf(type.toLowerCase())];
					const textTransform = ['toString', 'toUpperCase']['eEfFgG'.indexOf(type) % 2];

					value = prefix + Math.abs(number)[method](precision);
					return justify(value, prefix, leftJustify, minWidth, zeroPad)[textTransform]();
				};
				default: return substring;
			}
		};
		
		return format.replace(regex, doFormat);
	};
	
	toUpperCamelCase (str: string) {
		if (!str) {
			return '';
		};

		return this.toCamelCase(str).replace(/^[a-z]/, char => char.toUpperCase());
	};
	
	toCamelCase (str: string): string {
		if (!str) {
			return '';
		};

		return String(str || '').replace(/[_-\s]([a-zA-Z])/g, (_, char) => char.toUpperCase()).replace(/^[A-Z]/, char => char.toLowerCase());
	};

	fromCamelCase (str: string, symbol: string) {
		if (!str) {
			return '';
		};

		return String(str || '').replace(/([A-Z]{1})/g, (_, char) => symbol + char.toLowerCase());
	};

	ucFirst (str: string): string {
		if (!str) {
			return '';
		};

		return String(str || '').charAt(0).toUpperCase() + str.slice(1).toLowerCase();
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

	objectCompare (o1: any, o2: any): boolean {
		o1 = o1 || {};
		o2 = o2 || {};
		
		const k1 = Object.keys(o1);
		const k2 = Object.keys(o2);
		const v1 = Object.values(o1);
		const v2 = Object.values(o2);
		const sort = (c1: any, c2: any) => {
			if (c1 > c2) return 1;
			if (c1 < c2) return -1;
			return 0;
		};
		
		k1.sort(sort);
		k2.sort(sort);
		v1.sort(sort);
		v2.sort(sort);
		
		return this.compareJSON(k1, k2) && this.compareJSON(v1, v2);
	};

	compareJSON (o1: any, o2: any): boolean {
		return JSON.stringify(o1) === JSON.stringify(o2);
	};

	getKeyByValue (o: any, v: any) {
		return Object.keys(o || {}).find(k => o[k] === v);
	};

	hasProperty (o: any, p: string) {
		o = o || {};
		return Object.prototype.hasOwnProperty.call(o, p);
	};

	// Clear object for smaller console output
	objectClear (o: any) {
		for (const k in o) {
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
		const o = {};
		for (let i = 0; i < a.length; ++i) {
			if ((a[i].constructor === Array) && (a[i].length == 2)) {
				const value = a[i][1];
				let v = '';

				for (const k in value) {
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
			s = s.substring(0, l) + (!noEnding ? '…' : '');
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

	copyToast (label: string, text: string, toast?: string) {
		this.clipboardCopy({ text });
		Preview.toastShow({ text: this.sprintf(toast || translate('toastCopy'), label) });
	};
	
	cacheImages (images: string[], callBack?: () => void) {
		let loaded = 0;
		const cb = () => {
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

	round (v: number, l: number) {
		const d = Math.pow(10, l);
		return d > 0 ? Math.round(v * d) / d : Math.round(v);
	};

	formatNumber (v: number): string {
		let s = String(v || '');
		if (s.length < 6) {
			return s;
		};

		let parts = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 8 }).formatToParts(v);
		if (parts && parts.length) {
			parts = parts.map((it: any) => {
				if (it.type == 'group') {
					it.value = ' ';
				};
				return it.value;
			});
			s = parts.join('');
		};
		return s;
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
		return s.toString().replace(new RegExp(/\n/gi), '<br/>');
	};
	
	mapToArray (list: any[], field: string): any {
		list = list|| [] as any[];
		
		const map = {} as any;
		for (const item of list) {
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
		for (const field in map) {
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
			url = `http://${url}`;
		};

		return url;
	};
	
	renderLinks (obj: any) {
		const links = obj.find('a');

		links.off('click auxclick');
		links.on('auxclick', e => e.preventDefault());
		links.click((e: any) => {
			const el = $(e.currentTarget);
			const href = el.attr('href') || el.attr('xlink:href');

			e.preventDefault();
			el.hasClass('path') ? Action.openPath(href) : Action.openUrl(href);
		});
	};
	
	checkEmail (v: string) {
		v = String(v || '');

		const uc = '\\P{Script_Extensions=Latin}';
		const reg = new RegExp(`^[-\\.\\w${uc}]+@([-\\.\\w${uc}]+\\.)+[-\\w${uc}]{2,12}$`, 'gu');
		return reg.test(v);
	};

	getSelectionRange (): Range {
		const sel: Selection = window.getSelection();
		let range: Range = null;

		if (sel && (sel.rangeCount > 0)) {
			range = sel.getRangeAt(0);
		};

		return range;
	};

	getSelectionRect () {
		let rect: any = { x: 0, y: 0, width: 0, height: 0 };
		const range = this.getSelectionRange();
		if (range) {
			rect = range.getBoundingClientRect() as DOMRect;
		};
		rect = this.objectCopy(rect);

		if (!rect.x && !rect.y && !rect.width && !rect.height) {
			rect = null;
		};

		return rect;
	};

	clearSelection () {
		$(document.activeElement).trigger('blur');
		window.getSelection().removeAllRanges();
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

	getPlatform (): I.Platform {
		return J.Constant.platforms[this.getElectron().platform] || I.Platform.None;
	};

	isPlatformMac (): boolean {
		return this.getPlatform() == I.Platform.Mac;
	};

	isPlatformWindows (): boolean {
		return this.getPlatform() == I.Platform.Windows;
	};

	isPlatformLinux (): boolean {
		return this.getPlatform() == I.Platform.Linux;
	};

	checkErrorCommon (code: number): boolean {
		if (!code) {
			return true;
		};

		// App is already working
		if (code == J.Error.Code.ANOTHER_ANYTYPE_PROCESS_IS_RUNNING) {
			alert('You have another instance of anytype running on this machine. Closing...');
			Renderer.send('exit', false);
			return false;
		};

		// App needs update
		if ([ J.Error.Code.ANYTYPE_NEEDS_UPGRADE, J.Error.Code.PROTOCOL_NEEDS_UPGRADE ].includes(code)) {
			this.onErrorUpdate();
			return false;
		};

		return true;
	};

	checkErrorOnOpen (rootId: string, code: number, context: any): boolean {
		if (!rootId || !code) {
			return true;
		};

		if (context) {
			context.setState({ isLoading: false });
		};

		if (!this.checkErrorCommon(code)) {
			return false;
		};

		if ([ J.Error.Code.NOT_FOUND, J.Error.Code.OBJECT_DELETED ].includes(code)) {
			if (context) {
				context.setState({ isDeleted: true });
			};
		} else {
			const logPath = this.getElectron().logPath();

			S.Popup.open('confirm', {
				data: {
					icon: 'error',
					bgColor: 'red',
					title: translate('commonError'),
					text: translate('popupConfirmObjectOpenErrorText'),
					textConfirm: translate('popupConfirmObjectOpenErrorButton'),
					onConfirm: () => {
						C.DebugTree(rootId, logPath, false, (message: any) => {
							if (!message.error.code) {
								Action.openPath(logPath);
							};
						});

						U.Space.openDashboard('route', { replace: true });
					}
				},
			});
		};

		return false;
	};

	onErrorUpdate (onConfirm?: () => void) {
		S.Popup.open('confirm', {
			data: {
				icon: 'update',
				bgColor: 'green',
				title: translate('popupConfirmNeedUpdateTitle'),
				text: translate('popupConfirmNeedUpdateText'),
				textConfirm: translate('commonUpdate'),
				textCancel: translate('popupConfirmUpdatePromptCancel'),
				onConfirm: () => {
					Renderer.send('update');

					if (onConfirm) {
						onConfirm();
					};
				},
			},
		});
	};

	onInviteRequest () {
		S.Popup.open('confirm', {
			data: {
				title: translate('popupInviteInviteConfirmTitle'),
				text: translate('popupInviteInviteConfirmText'),
				textConfirm: translate('commonDone'),
				textCancel: translate('popupInviteInviteConfirmCancel'),
				onCancel: () => {
					sidebar.settingsOpen('spaceList');
				},
			},
		});
	};

	getScheme(url: string): string {
		try {
			const u = new URL(String(url || ''));
			return u.protocol.replace(/:$/, '');
		} catch {
			return '';
		}
	};

	intercept (obj: any, change: any) {
		return this.compareJSON(change.newValue, obj[change.name]) ? null : change;
	};

	getScrollContainer (isPopup: boolean) {
		return (isPopup ? $('#popupPage-innerWrap') : $(window)) as JQuery<HTMLElement>;
	};

	getPageContainer (isPopup: boolean) {
		return $(isPopup ? '#popupPage-innerWrap' : '#page.isFull');
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
				return `#${type}`;

			case 'popupRelation':
				return `#${type}-innerWrap`;
		};
	};

	searchParam (url: string): any {
		const a = String(url || '').replace(/^\?/, '').split('&');
		const param: any = {};
		
		a.forEach((s) => {
			const [ key, value ] = s.split('=');

			if (key) {
				param[key] = decodeURIComponent(value);
			};
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

	getUrlsFromText (text: string): any[] {
		const urls = [];
		const words = text.split(/[\s\r\n]+/);

		let offset = 0;

		for (const word of words) {
			if (this.matchUrl(word) || this.matchLocalPath(word)) {
				const from = text.substring(offset).indexOf(word) + offset;

				offset = from + word.length;
				urls.push({ value: word, from, to: offset, isLocal: !!this.matchLocalPath(word) });
			};
		};

		return urls;
	};

	matchUrl (s: string): string {
		const m = String(s || '').match(/^(?:[a-z]+:(?:\/\/)?)([^\s\/\?#]+)([^\s\?#]+)(?:\?([^#\s]*))?(?:#([^\s]*))?$/gi);
		return (m && m.length) ? m[0] : '';
	};

	matchDomain (s: string): string {
		const m = String(s || '').match(/^([a-z]+:\/\/)?([\w-]+\.)+[\w-]+(:\d+)?(\/[^?\s]*)?(\?[^#\s]*)?(#.*)?$/gi);
		return (m && m.length) ? m[0] : '';
	};

	matchLocalPath (s: string): string {
		s = String(s || '');

		const rw = new RegExp(/^(?:[a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)\\(?:[\p{L}\p{N}\s\._-]+\\)*[\p{L}\p{N}\s\._-]+(?:\.[\p{L}\p{N}\s_-]+)?$/ugi);
		const ru = new RegExp(/^(\/[\p{L}\p{N}\s\._-]+)+\/?$/u);

		let m = s.match(rw);
		if (!m) {
			m = s.match(ru);
		};

		return (m && m.length) ? m[0] : '';
	};

	getDataTransferFiles (items: any[]): any[] {
		if (!items || !items.length) {
			return [];
		};

		const files: any[] = [];
		for (const item of items) {
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

		const ret = [];
		for (const item of items) {
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

		for (const item of items) {
			item.getAsString(cb);
		};
	};

	saveClipboardFiles (items: any[], data: any, callBack: (data: any) => void) {
		if (!items.length) {
			return;
		};

		let n = 0;

		const ret: any[] = [];
		const cb = () => {
			n++;
			if (n == items.length) {
				callBack({ ...data, files: ret });
			};
		};

		for (const item of items) {
			if (item.path) {
				ret.push(item);
				cb();
			} else {
				const reader = new FileReader();
				reader.onload = () => {
					ret.push({
						...item,
						path: this.getElectron().fileWrite(item.name, reader.result, { encoding: 'binary' }),
					});
					cb();
				};
				reader.onerror = cb;
				reader.readAsBinaryString(item.file ? item.file : item);
			};
		};
	};

	dataProps (data: any) {
		data = data || {};

		const ret: any = {};
		for (const k in data) {
			ret[`data-${k}`] = data[k];
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
		const Text = require('json/text.json');

		return Text[id] ? translate(id) : description;
	};

	sanitize (s: string): string {
		s = String(s || '');

		if (!TEST_HTML.test(s)) {
			return s;
		};

		const tags = [ 'b', 'br', 'a', 'ul', 'li', 'h1', 'span', 'p', 'name', 'smile', 'img' ].concat(Object.values(Mark.getTags()));

		return DOMPurify.sanitize(s, { 
			ADD_TAGS: tags,
			ADD_ATTR: [ 'contenteditable' ],
			ALLOWED_URI_REGEXP: /^(?:(?:[a-z]+):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
		});
	};

	fixAsarPath (path: string): string {
		const electron = this.getElectron();

		if (!electron.dirName || !electron.isPackaged) {
			return path;
		};

		let href = electron.dirName(location.href);
		href = href.replace('/app.asar/', '/app.asar.unpacked/');
		return href + path.replace(/^\.\//, '/');
	};

	injectCss (id: string, css: string) {
		const head = $('head');
		const element = $(`<style id="${id}" type="text/css">${css}</style>`);

		head.find(`style#${id}`).remove();
		head.append(element);
	};

	addScript (id: string, src: string) {
		const body = $('body');
		const element = $(`<script id="${id}" type="text/javascript" src="${src}"></script>`);

		body.find(`script#${id}`).remove();
		body.append(element);
	};

	uint8ToString (u8a: Uint8Array): string {
		const CHUNK = 0x8000;
		const c = [];

		for (let i = 0; i < u8a.length; i += CHUNK) {
			c.push(String.fromCharCode.apply(null, u8a.subarray(i, i + CHUNK)));
		};
		return c.join('');
	};

	enumKey (e: any, v: any) {
		let k = '';
		for (const key in e) {
			if (v === e[key]) {
				k = key;
				break;
			};
		};
		return k;
	};

	stripTags (s: string): string {
		return String(s || '').replace(/<[^>]+>/g, '');
	};

	normalizeLineEndings (s: string) {
		return String(s || '').replace(/\r\n?/g, '\n');
	};

	htmlSpecialChars (s: string) {
		return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	};

	fromHtmlSpecialChars (s: string) {
		return String(s || '').replace(/(&lt;|&gt;|&amp;)/g, (s: string, p: string) => {
			if (p == '&lt;') p = '<';
			if (p == '&gt;') p = '>';
			if (p == '&amp;') p = '&';
			return p;
		});
	};

	copyCssSingle (src: HTMLElement, dst: HTMLElement) {
		const styles = document.defaultView.getComputedStyle(src, '');
		const css: any = {};

		for (let i = 0; i < styles.length; i++) {
			const name = styles[i];
			const value = styles.getPropertyValue(name);

			css[name] = value;
		};

		css.visibility = 'visible';
		$(dst).css(css);
	};

	copyCss (src: HTMLElement, dst: HTMLElement) {
		this.copyCssSingle(src, dst);

		const srcList = src.getElementsByTagName('*');
		const dstList = dst.getElementsByTagName('*');

		for (let i = 0; i < srcList.length; i++) {
			const srcElement = srcList[i] as HTMLElement;
			const dstElement = dstList[i] as HTMLElement;

			this.copyCssSingle(srcElement, dstElement);
		};
	};

	notification (param: any, onClick?: () => void) {
		const title = U.Common.stripTags(String(param.title || ''));
		const text = U.Common.stripTags(String(param.text || ''));

		if (!text) {
			return;
		};

		const electron = this.getElectron();
		const item = new window.Notification(title, { body: text });

		item.onclick = () => {
			electron.focus();

			if (onClick) {
				onClick();
			};
		};
	};

	isAlphaVersion (): boolean {
		return !!this.getElectron().version.app.match(/alpha/);
	};

	isBetaVersion (): boolean {
		return !!this.getElectron().version.app.match(/beta/);
	};

	checkRtl (s: string): boolean {
		return /^[\u04c7-\u0591\u05D0-\u05EA\u05F0-\u05F4\u0600-\u06FF]/.test(s);
	};

	slug (s: string): string {
		return String(s || '').toLowerCase().trim().normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9\s\-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-');
	};

};

export default new UtilCommon();
