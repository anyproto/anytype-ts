import $ from 'jquery';
import raf from 'raf';
import DOMPurify from 'dompurify';
import slugify from '@sindresorhus/slugify';
import { I, C, S, J, U, Preview, Renderer, translate, Mark, Action, Storage } from 'Lib';

const katex = require('katex');
require('katex/dist/contrib/mhchem');

const ALLOWED_KATEX = ['\\url', '\\href', '\\includegraphics'];
const TEST_HTML = /<[^>]*>/;
const UNSAFE_HTML_PATTERN = /<\s*(script|iframe|svg|img|math|object|embed|style|form|input|video|audio|source)\b|<[^>]+\s+on\w+\s*=|<[^>]+\s+style\s*=\s*["'][^"']*(?:javascript:|data:)|<[^>]+\s+(?:src|href|data|action)\s*=\s*["']?\s*(?:javascript:|data:)|<style[^>]*>[^<]*(?:javascript:|data:)/iu;
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const iconCache: Map<string, string> = new Map();

class UtilCommon {

	/**
	 * Returns the Electron object from the window, or an empty object if not available.
	 */
	getElectron () {
		return window.Electron || {};
	};

	/**
	 * Returns the global configuration object from the window.
	 */
	getGlobalConfig () {
		return window.AnytypeGlobalConfig || {};
	};

	/**
	 * Formats a string using sprintf-style formatting.
	 * @param {...any[]} args - The format string followed by values to format.
	 * @returns {string} The formatted string.
	 */
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
	
	/**
	 * Converts a string to UpperCamelCase.
	 * @param {string} str - The string to convert.
	 * @returns {string} The converted string.
	 */
	toUpperCamelCase (str: string) {
		if (!str) {
			return '';
		};

		return this.toCamelCase(str).replace(/^[a-z]/, char => char.toUpperCase());
	};
	
	/**
	 * Converts a string to camelCase.
	 * @param {string} str - The string to convert.
	 * @returns {string} The converted string.
	 */
	toCamelCase (str: string): string {
		if (!str) {
			return '';
		};

		return String(str || '').replace(/[_-\s]([a-zA-Z])/g, (_, char) => char.toUpperCase()).replace(/^[A-Z]/, char => char.toLowerCase());
	};

	/**
	 * Converts a camelCase string to a delimited string using the given symbol.
	 * @param {string} str - The camelCase string.
	 * @param {string} symbol - The symbol to use as a delimiter.
	 * @returns {string} The delimited string.
	 */
	fromCamelCase (str: string, symbol: string) {
		if (!str) {
			return '';
		};

		return String(str || '').replace(/([A-Z]{1})/g, (_, char) => symbol + char.toLowerCase());
	};

	/**
	 * Capitalizes the first character of a string and lowercases the rest.
	 * @param {string} str - The string to capitalize.
	 * @returns {string} The capitalized string.
	 */
	ucFirst (str: string): string {
		if (!str) {
			return '';
		};

		return String(str || '').charAt(0).toUpperCase() + str.slice(1).toLowerCase();
	};

	/**
	 * Deep copies an object using JSON serialization.
	 * @param {any} o - The object to copy.
	 * @returns {any} The copied object.
	 */
	objectCopy (o: any): any {
		if (typeof o === 'undefined') {
			o = {};
		};
		return JSON.parse(JSON.stringify(o));
	};
	
	/**
	 * Returns the length of an object or array.
	 * @param {any} o - The object or array.
	 * @returns {number} The length.
	 */
	objectLength (o: any) {
		o = o || {};
		return this.hasProperty(o, 'length') ? o.length : Object.keys(o).length;
	};

	/**
	 * Compares two objects for equality by keys and values.
	 * @param {any} o1 - The first object.
	 * @param {any} o2 - The second object.
	 * @returns {boolean} True if objects are equal, false otherwise.
	 */
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

	/**
	 * Compares two objects using JSON stringification.
	 * @param {any} o1 - The first object.
	 * @param {any} o2 - The second object.
	 * @returns {boolean} True if objects are equal, false otherwise.
	 */
	compareJSON (o1: any, o2: any): boolean {
		return JSON.stringify(o1) === JSON.stringify(o2);
	};

	/**
	 * Returns the key in an object that matches the given value.
	 * @param {any} o - The object to search.
	 * @param {any} v - The value to find.
	 * @returns {string|undefined} The key if found, otherwise undefined.
	 */
	getKeyByValue (o: any, v: any) {
		return Object.keys(o || {}).find(k => o[k] === v);
	};

	/**
	 * Checks if an object has a property.
	 * @param {any} o - The object.
	 * @param {string} p - The property name.
	 * @returns {boolean} True if the property exists, false otherwise.
	 */
	hasProperty (o: any, p: string) {
		o = o || {};
		return Object.prototype.hasOwnProperty.call(o, p);
	};

	/**
	 * Recursively clears empty or undefined properties from an object.
	 * @param {any} o - The object to clear.
	 * @returns {any} The cleared object.
	 */
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

	/**
	 * Converts an array of key-value pairs to an object, using the first value found in each pair.
	 * @param {any[]} a - The array of key-value pairs.
	 * @returns {object} The resulting object.
	 */
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

	/**
	 * Returns a new array with only unique values from the input array.
	 * @param {any[]} a - The array to filter.
	 * @returns {any[]} The array with unique values.
	 */
	arrayUnique (a: any[]) {
		return a.length >= 2 ? [ ...new Set(a) ] : a;
	};
	
	/**
	 * Returns a new array with unique objects based on a key.
	 * @param {any[]} a - The array of objects.
	 * @param {string} k - The key to determine uniqueness.
	 * @returns {any[]} The array with unique objects.
	 */
	arrayUniqueObjects (a: any[], k: string) {
		const res: any[] = [];
		const map = new Map();
		
		for (const item of a) {
			if (!item) {
				continue;
			};

			if (!map.has(item[k])) {
				map.set(item[k], true);
				res.push(item);
			};
		};

		return res;
    };

	/**
	 * Returns the values of an array or object.
	 * @param {any} a - The array or object.
	 * @returns {any[]} The values as an array.
	 */
	arrayValues (a: any) {
		return this.hasProperty(a, 'length') ? a : Object.values(a);
	};

	/**
	 * Removes a substring from a string between start and end indices.
	 * @param {string} haystack - The original string.
	 * @param {number} start - The start index.
	 * @param {number} end - The end index.
	 * @returns {string} The resulting string.
	 */
	stringCut (haystack: string, start: number, end: number): string {
		return String(haystack || '').substring(0, start) + haystack.substring(end);
	};

	/**
	 * Inserts a substring into a string at the specified indices.
	 * @param {string} haystack - The original string.
	 * @param {string} needle - The string to insert.
	 * @param {number} start - The start index.
	 * @param {number} end - The end index.
	 * @returns {string} The resulting string.
	 */
	stringInsert (haystack: string, needle: string, start: number, end: number): string {
		haystack = String(haystack || '');
		return haystack.substring(0, start) + needle + haystack.substring(end);
	};
	
	/**
	 * Shortens a string to a specified length, optionally adding an ellipsis.
	 * @param {string} s - The string to shorten.
	 * @param {number} [l=16] - The maximum length.
	 * @param {boolean} [noEnding] - If true, do not add an ellipsis.
	 * @returns {string} The shortened string.
	 */
	shorten (s: string, l?: number, noEnding?: boolean) {
		s = String(s || '');
		l = Number(l) || 16;
		if (s.length > l) {
			s = s.substring(0, l) + (!noEnding ? '…' : '');
		};
		return s;
	};

	/**
	 * Masks the middle of a string, showing only the first and last n characters.
	 * @param {string} s - The string to mask.
	 * @param {number} n - The number of characters to show at each end.
	 * @returns {string} The masked string.
	 */
	shortMask (s: string, n: number): string {
		s = String(s || '');

		const l = s.length;

		if (l <= n*2) {
			return s;
		};

		let ret = '';
		ret += s.substring(0, n);
		ret += '...';
		ret += s.substring(l - n);

		return ret;
	};

	/**
	 * Copies data to the clipboard and optionally calls a callback.
	 * @param {any} data - The data to copy (text, html, anytype).
	 * @param {function} [callBack] - Optional callback after copy.
	 */
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

	/**
	 * Shows a toast and copies text to the clipboard.
	 * @param {string} label - The label for the toast.
	 * @param {string} text - The text to copy.
	 * @param {string} [toast] - Optional custom toast message.
	 */
	copyToast (label: string, text: string, toast?: string) {
		this.clipboardCopy({ text });
		Preview.toastShow({ text: this.sprintf(toast || translate('toastCopy'), label) });
	};
	
	/**
	 * Preloads images and calls a callback when all are loaded.
	 * @param {string[]} images - Array of image URLs.
	 * @param {function} [callBack] - Optional callback after all images are loaded.
	 */
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
	
	/**
	 * Returns a random integer between min and max (inclusive).
	 * @param {number} min - The minimum value.
	 * @param {number} max - The maximum value.
	 * @returns {number} The random integer.
	 */
	rand (min: number, max: number): number {
		if (max && (max != min)) {
			return Math.floor(Math.random() * (max - min + 1)) + min;
		} else {
			return Math.floor(Math.random() * (min + 1));
		};
	};

	/**
	 * Rounds a number to a specified number of decimal places.
	 * @param {number} v - The value to round.
	 * @param {number} l - The number of decimal places.
	 * @returns {number} The rounded value.
	 */
	round (v: number, l: number) {
		const d = Math.pow(10, l);
		return d > 0 ? Math.round(v * d) / d : Math.round(v);
	};

	/**
	 * Formats a number with spaces as thousands separators.
	 * @param {number} v - The number to format.
	 * @returns {string} The formatted number as a string.
	 */
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

	/**
	 * Sets the border color of an object based on its color and a parameter.
	 * @param {any} obj - The jQuery object.
	 * @param {any} param - The parameter with border alpha value.
	 */
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
	
	/**
	 * Replaces line breaks in a string with <br/> tags.
	 * @param {string} s - The string to convert.
	 * @returns {string} The converted string.
	 */
	lbBr (s: string) {
		return s.toString().replace(new RegExp(/\n/gi), '<br/>');
	};
	
	/**
	 * Groups an array of objects by a field into a map of arrays.
	 * @param {any[]} list - The array of objects.
	 * @param {string} field - The field to group by.
	 * @returns {object} The grouped map.
	 */
	mapToArray (list: any[], field: string): any {
		list = list|| [] as any[];
		
		const map = {} as any;
		for (const item of list) {
			map[item[field]] = map[item[field]] || [];
			map[item[field]].push(item);
		};
		return map;
	};

	/**
	 * Maps an array of objects to an object using a field as the key.
	 * @param {any[]} list - The array of objects.
	 * @param {string} field - The field to use as the key.
	 * @returns {object} The mapped object.
	 */
	mapToObject (list: any[], field: string) {
		const obj: any = {};
		for (let i = 0; i < list.length; i++) {
			obj[list[i][field]] = list[i];
		};
		return obj;
	};
	
	/**
	 * Flattens a map of arrays into a single array.
	 * @param {object} map - The map of arrays.
	 * @returns {any[]} The flattened array.
	 */
	unmap (map: any) {
		let ret: any[] = [] as any[];
		for (const field in map) {
			ret = ret.concat(map[field]);
		};
		return ret;
	};
	
	/**
	 * Escapes special regex characters in a string.
	 * @param {string} v - The string to escape.
	 * @returns {string} The escaped string.
	 */
	regexEscape (v: string) {
		return String(v || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	};

	/**
	 * Ensures a URL has a scheme, defaulting to http if missing.
	 * @param {string} url - The URL to fix.
	 * @returns {string} The fixed URL.
	 */
	urlFix (url: string): string {
		url = String(url || '');
		if (!url) {
			return '';
		};

		// Sanity check: reject massive or clearly invalid strings
		if (!url || (url.length > 2048)) {
			return '';
		};

		const scheme = this.getScheme(url);
		if (scheme) {
			return url;
		};

		if (this.matchEmail(url)) {
			url = `mailto:${url}`;
		} else 
		if (this.matchPhone(url)) {
			url = `tel:${url}`;
		} else 
		if (this.matchPath(url)) {
			url = `file://${url}`;
		};

		return url;
	};
	
	/**
	 * Attaches click handlers to links in a jQuery object to open URLs or paths.
	 * @param {any} obj - The jQuery object containing links.
	 */
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
	
	/**
	 * Gets the current selection range in the window.
	 * @returns {Range|null} The selection range or null if none.
	 */
	getSelectionRange (): Range {
		const sel: Selection = window.getSelection();
		let range: Range = null;

		if (sel && (sel.rangeCount > 0)) {
			range = sel.getRangeAt(0);
		};

		return range;
	};

	/**
	 * Gets the bounding rectangle of the current selection.
	 * @returns {object|null} The rectangle or null if no selection.
	 */
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

	/**
	 * Clears the current selection in the document.
	 */
	clearSelection () {
		$(document.activeElement).trigger('blur');
		const selection = window.getSelection();
		if (selection) {
			selection.removeAllRanges();
		};
	};

	/**
	 * Returns the correct plural form of a word based on a count.
	 * @param {any} cnt - The count.
	 * @param {string} words - The word forms separated by '|'.
	 * @returns {string} The correct word form.
	 */
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

	/**
	 * Gets the current platform as an enum value.
	 * @returns {I.Platform} The platform.
	 */
	getPlatform (): I.Platform {
		return J.Constant.platforms[this.getElectron().platform] || I.Platform.None;
	};

	/**
	 * Checks if the current platform is Mac.
	 * @returns {boolean} True if Mac, false otherwise.
	 */
	isPlatformMac (): boolean {
		return this.getPlatform() == I.Platform.Mac;
	};

	/**
	 * Checks if the current platform is Windows.
	 * @returns {boolean} True if Windows, false otherwise.
	 */
	isPlatformWindows (): boolean {
		return this.getPlatform() == I.Platform.Windows;
	};

	/**
	 * Checks if the current platform is Linux.
	 * @returns {boolean} True if Linux, false otherwise.
	 */
	isPlatformLinux (): boolean {
		return this.getPlatform() == I.Platform.Linux;
	};

	/**
	 * Handles common error codes and shows alerts or popups as needed.
	 * @param {number} code - The error code.
	 * @returns {boolean} True if no critical error, false otherwise.
	 */
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

	/**
	 * Handles errors when opening an object, showing popups as needed.
	 * @param {string} rootId - The root object ID.
	 * @param {number} code - The error code.
	 * @param {any} context - The React context or component.
	 * @returns {boolean} True if no critical error, false otherwise.
	 */
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
					title: translate('commonError'),
					text: translate('popupConfirmObjectOpenErrorText'),
					textConfirm: translate('popupConfirmObjectOpenErrorButton'),
					onConfirm: () => {
						C.DebugTree(rootId, logPath, false, (message: any) => {
							if (!message.error.code) {
								Action.openPath(logPath);
							};
						});

						U.Space.openDashboard();
					}
				},
			});
		};

		return false;
	};

	/**
	 * Shows an update popup and calls a callback on confirmation.
	 * @param {function} [onConfirm] - Optional callback after update confirmation.
	 */
	onErrorUpdate (onConfirm?: () => void) {
		S.Popup.open('confirm', {
			data: {
				icon: 'update',
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

	/**
	 * Shows an invite request popup and handles navigation on cancel.
	 */
	onInviteRequest () {
		S.Popup.open('confirm', {
			data: {
				title: translate('popupInviteInviteConfirmTitle'),
				text: translate('popupInviteInviteConfirmText'),
				textConfirm: translate('commonDone'),
				textCancel: translate('popupInviteInviteConfirmCancel'),
				onCancel: () => {
					U.Object.openRoute({ id: 'spaceList', layout: I.ObjectLayout.Settings });
				},
			},
		});
	};

	/**
	 * Extracts the scheme (protocol) from a URL string.
	 * @param {string} url - The URL string.
	 * @returns {string} The scheme or empty string if invalid.
	 */
	getScheme(url: string): string {
		try {
			const u = new URL(String(url || ''));
			return u.protocol.replace(/:$/, '');
		} catch {
			return '';
		}
	};

	/**
	 * Compares an object's property to a new value and returns the change if different.
	 * @param {any} obj - The object.
	 * @param {any} change - The change object with newValue and name.
	 * @returns {any|null} The change if different, otherwise null.
	 */
	intercept (obj: any, change: any) {
		return this.compareJSON(change.newValue, obj[change.name]) ? null : change;
	};

	/**
	 * Returns the scroll container jQuery object depending on popup state.
	 * @param {boolean} isPopup - Whether the context is a popup.
	 * @returns {JQuery<HTMLElement>} The scroll container.
	 */
	getScrollContainer (isPopup: boolean) {
		return $(isPopup ? '#popupPage-innerWrap' : '#page.isFull');
	};

	/**
	 * Returns the scroll top position of the scroll container.
	 * @param {boolean} isPopup - Whether the context is a popup.
	 * @returns {number} The scroll top position.
	 */
	getScrollContainerTop (isPopup: boolean) {
		return Math.ceil(this.getScrollContainer(isPopup).scrollTop());
	};

	/**
	 * Returns the container class name based on popup state.
	 * @param {boolean} isPopup - Whether the context is a popup.
	 * @returns {string} The container class name.
	 */
	getContainerClassName (isPopup: boolean): string {
		return isPopup ? 'isPopup' : 'isFull';
	};

	/**
	 * Returns the page flex container jQuery object depending on popup state.
	 * @param {boolean} isPopup - Whether the context is a popup.
	 * @returns {JQuery<HTMLElement>} The page flex container.
	 */
	getPageFlexContainer (isPopup: boolean) {
		return $(`#pageFlex.${this.getContainerClassName(isPopup)}`);
	};

	/**
	 * Returns the page container jQuery object depending on popup state.
	 * @param {boolean} isPopup - Whether the context is a popup.
	 * @returns {JQuery<HTMLElement>} The page container.
	 */
	getPageContainer (isPopup: boolean) {
		return $(`#page.${this.getContainerClassName(isPopup)}`);
	};

	/**
	 * Returns the selector for a cell container based on type.
	 * @param {string} type - The type of container.
	 * @returns {string} The selector string.
	 */
	getCellContainer (type: string) {
		switch (type) {
			default:
			case 'page':
				return '#pageFlex.isFull';

			case 'popup':
				return '#pageFlex.isPopup';

			case 'menuBlockAdd':
				return `#${type}`;

			case 'popupRelation':
				return `#${type}-innerWrap`;

			case 'sidebarRight':
				return `#sidebarRight`;
		};
	};

	/**
	 * Parses URL search parameters into an object.
	 * @param {string} url - The URL string.
	 * @returns {object} The parameters as key-value pairs.
	 */
	searchParam (url: string): any {
		const param: any = {};

		try {
			const u = new URLSearchParams(String(url || ''));
			u.forEach((v, k) => {
				param[k] = v;
			});

		} catch (e) { /**/ };
		return param;
	};

	/**
	 * Adds a class to the HTML body with a given prefix and value.
	 * @param {string} prefix - The class prefix.
	 * @param {string} v - The value to append.
	 */
	addBodyClass (prefix: string, v: string) {
		const obj = $('html');
		const reg = new RegExp(`^${prefix}`);
		const c = String(obj.attr('class') || '').split(' ').filter(it => !it.match(reg));

		if (v) {
			c.push(this.toCamelCase(`${prefix}-${v}`));
		};

		obj.attr({ class: c.join(' ') });
	};

	/**
	 * Finds the closest number in an array to a goal value.
	 * @param {number[]} array - The array of numbers.
	 * @param {number} goal - The target value.
	 * @returns {number} The closest number.
	 */
	findClosestElement (array: number[], goal: number) {
		return array.reduce((prev: number, curr: number) => {
			return Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev;
		}, 0);
	};

	/**
	 * Checks if two rectangles collide.
	 * @param {object} rect1 - The first rectangle.
	 * @param {object} rect2 - The second rectangle.
	 * @returns {boolean} True if they collide, false otherwise.
	 */
	rectsCollide (rect1: any, rect2: any) {
		return this.coordsCollide(rect1.x, rect1.y, rect1.width, rect1.height, rect2.x, rect2.y, rect2.width, rect2.height);
	};
	
	/**
	 * Checks if two sets of coordinates and dimensions collide.
	 * @param {number} x1 - X of first.
	 * @param {number} y1 - Y of first.
	 * @param {number} w1 - Width of first.
	 * @param {number} h1 - Height of first.
	 * @param {number} x2 - X of second.
	 * @param {number} y2 - Y of second.
	 * @param {number} w2 - Width of second.
	 * @param {number} h2 - Height of second.
	 * @returns {boolean} True if they collide, false otherwise.
	 */
	coordsCollide (x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number) {
		return !((y1 + h1 < y2) || (y1 > y2 + h2) || (x1 + w1 < x2) || (x1 > x2 + w2));
	};

	/**
	 * Extracts URLs from a block of text.
	 * @param {string} text - The text to search.
	 * @returns {any[]} Array of found URLs with positions and type.
	 */
	getUrlsFromText (text: string): any[] {
		const urls = [];
		const words = text.split(/[\s\r\n]+/);

		let offset = 0;

		for (const word of words) {
			const isUrl = !!this.matchUrl(word) || !!this.matchDomain(word);
			const isEmail = !!this.matchEmail(word);
			const isLocal = !!this.matchPath(word);
			const isPhone = !!this.matchPhone(word);
			const embedProcessor = U.Embed.getProcessorByUrl(word);

			if (isUrl || isLocal || isEmail || isPhone) {
				const from = text.substring(offset).indexOf(word) + offset;

				offset = from + word.length;
				urls.push({ value: word, from, to: offset, isLocal, isUrl, isEmail, isPhone, embedProcessor });
			};
		};

		return urls;
	};

	/**
	 * Matches a string as a URL.
	 * @param {string} s - The string to match.
	 * @returns {string} The matched URL or empty string.
	 */
	matchUrl (s: string): string {
		const m = String(s || '').match(/^(?:[a-z]+:(?:\/\/)?)([^\s\/\?#]+)([^\s\?#]+)(?:\?([^#\s]*))?(?:#([^\s]*))?\s?$/gi);
		return String(((m && m.length) ? m[0] : '') || '').trim();
	};

	/**
	 * Matches a string as a a valid email address.
	 * @param {string} v - The string to check.
	 * @returns {string} The matched email or empty string.
	 */
	matchEmail (v: string) {
		v = String(v || '');

		if (!/@/.test(v) || (v.length < 5)) {
			return '';
		};

		const uc = '\\P{Script_Extensions=Latin}';
		const m = v.match(new RegExp(`^[-\\.\\w${uc}]+@([-\\.\\w${uc}]+\\.)+[-\\w${uc}]{2,12}$`, 'gu'));

		return String(((m && m.length) ? m[0] : '') || '').trim();
	};

	/**
	 * Matches a string as a domain.
	 * @param {string} s - The string to match.
	 * @returns {string} The matched domain or empty string.
	 */
	matchDomain (s: string): string {
		const m = String(s || '').match(/^([a-z]+:\/\/)?([\w-]+\.)+[\w-]+(:\d+)?(\/[^?\s]*)?(\?[^#\s]*)?(#.*)?$/gi);
		return String(((m && m.length) ? m[0] : '') || '').trim();
	};

	/**
	 * Matches a string as a local file path.
	 * @param {string} s - The string to match.
	 * @returns {string} The matched path or empty string.
	 */
	matchPath (s: string): string {
		s = String(s || '');

		const rw = new RegExp(/^(file:\/\/)?(?:[a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)\\(?:[\p{L}\p{N}\s\._-]+\\)*[\p{L}\p{N}\s\._-]+(?:\.[\p{L}\p{N}\s_-]+)?$/ugi);
		const ru = /^(file:\/\/\/?)(\/[\p{L}\p{M}\p{N}\s._%\-(),]+)+\/?$/u;

		let m = s.match(rw);
		if (!m) {
			m = s.match(ru);
		};

		return String(((m && m.length) ? m[0] : '') || '').trim();
	};

	/**
	 * Matches a string as a valid phone number.
	 * Supports international and local formats with optional separators.
	 * @param {string} s - The string to match.
	 * @returns {string} The matched phone number or empty string.
	 */
	matchPhone (s: string): string {
		s = String(s || '');

		const re = new RegExp(
			// Matches optional +country code, spaces/dashes/parentheses, and digit groups
			/^(\+?\d{1,3}[\s-]?)?(\(?\d{1,4}\)?[\s-]?)?[\d\s()-]{5,}$/u
		);

		const m = s.match(re);
		return String(((m && m.length) ? m[0] : '') || '').trim();
	};

	/**
	 * Extracts files from a DataTransfer items array.
	 * @param {any[]} items - The DataTransfer items.
	 * @returns {any[]} Array of files.
	 */
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

	/**
	 * Extracts HTML string items from a DataTransfer items array.
	 * @param {any[]} items - The DataTransfer items.
	 * @returns {any[]} Array of string items.
	 */
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

	/**
	 * Gets a string from DataTransfer items and calls a callback with the result.
	 * @param {any[]} items - The DataTransfer items.
	 * @param {function} callBack - Callback with the resulting string.
	 */
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

	/**
	 * Saves clipboard files and calls a callback with the result.
	 * @param {any[]} items - The clipboard items.
	 * @param {any} data - Additional data to include.
	 * @param {function} callBack - Callback with the result.
	 */
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

	/**
	 * Converts an object's properties to data-* attributes.
	 * @param {any} data - The data object.
	 * @returns {object} The data-* attributes object.
	 */
	dataProps (data: any) {
		data = data || {};

		const ret: any = {};
		for (const k in data) {
			ret[`data-${k}`] = data[k];
		};
		return ret;
	};

	/**
	 * Returns the hostname from a URL or the URL itself if invalid.
	 * @param {string} url - The URL string.
	 * @returns {string} The hostname or original URL.
	 */
	shortUrl (url: string) {
		let a: any = {};
		try { a = new URL(url); } catch (e) {};
		return a.hostname || url;
	};

	/**
	 * Pauses all audio and video elements on the page.
	 */
	pauseMedia () {
		$('audio, video').each((i: number, item: any) => { item.pause(); });
	};

	/**
	 * Calculates a percentage of a number.
	 * @param {number} num - The base number.
	 * @param {number} percent - The percentage to calculate.
	 * @returns {number} The calculated value.
	 */
	getPercentage (num: number, percent: number) {
		return Number((num / 100 * percent).toFixed(3));
	};

	/**
	 * Returns the event namespace for editor resize events.
	 * @param {boolean} isPopup - Whether the context is a popup.
	 * @returns {string} The event namespace.
	 */
	getEventNamespace (isPopup: boolean): string {
		return isPopup ? '-popup' : '';
	};

	/**
	 * Triggers a resize event for the editor.
	 * @param {boolean} isPopup - Whether the context is a popup.
	 */
	triggerResizeEditor (isPopup: boolean) {
		$(window).trigger('resize.editor' + this.getEventNamespace(isPopup));
	};

	/**
	 * Get width and height of window DOM node
	 * Returns the percent value of part/whole.
	 * @param {number} part - The part value.
	 * @param {number} whole - The whole value.
	 * @returns {number} The percent value.
	 */
	getWindowDimensions (): { ww: number; wh: number } {
		const win = $(window);
		return { ww: win.width(), wh: win.height() };
	};

	/**
	 * Returns the percent value of part/whole.
	 * @param {number} part - The part value.
	 * @param {number} whole - The whole value.
	 * @returns {number} The percent value.
	 */
	getPercent (part: number, whole: number): number {
		return Number((part / whole * 100).toFixed(1));
	};

	/**
	 * Translates an error code for a command, or returns the error description.
	 * @param {string} command - The command name.
	 * @param {any} error - The error object.
	 * @returns {string} The translated error or description.
	 */
	translateError (command: string, error: any) {
		const { code, description } = error;
		const id = this.toCamelCase(`error-${command}${code}`);
		const Text = require('json/text.json');

		return Text[id] ? translate(id) : description;
	};

	/**
	 * Sanitizes a string for safe HTML rendering, allowing certain tags.
	 * @param {string} s - The string to sanitize.
	 * @returns {string} The sanitized string.
	 */
	sanitize (s: string, withStyles?: boolean): string {
		s = String(s || '');

		if (!TEST_HTML.test(s)) {
			return s;
		};

		if (!UNSAFE_HTML_PATTERN.test(s)) {
			return s;
		};

		const tags = [ 'b', 'br', 'a', 'ul', 'li', 'h1', 'span', 'p', 'name', 'smile', 'img' ].concat(Object.values(Mark.getTags()));
		const param: any = { 
			ADD_TAGS: tags,
			ADD_ATTR: [ 'contenteditable' ],
			ALLOWED_URI_REGEXP: /^(?:(?:[a-z]+):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
			FORBID_ATTR: [],
		};

		if (!withStyles) {
			param.FORBID_ATTR.push('style');
		};

		return DOMPurify.sanitize(s, param);
	};

	/**
	 * Fixes ASAR paths for Electron packaged apps.
	 * @param {string} path - The path to fix.
	 * @returns {string} The fixed path.
	 */
	fixAsarPath (path: string): string {
		const electron = this.getElectron();

		if (!electron.dirName || !electron.isPackaged) {
			return path;
		};

		let href = electron.dirName(location.href);
		href = href.replace('/app.asar/', '/app.asar.unpacked/');
		return href + path.replace(/^\.\//, '/');
	};

	/**
	 * Injects CSS into the document head with a given ID.
	 * @param {string} id - The style element ID.
	 * @param {string} css - The CSS string.
	 */
	injectCss (id: string, css: string) {
		const head = $('head');
		const element = $(`<style id="${id}" type="text/css">${css}</style>`);

		head.find(`style#${id}`).remove();
		head.append(element);
	};

	/**
	 * Adds a script tag to the document body with a given ID and source.
	 * @param {string} id - The script element ID.
	 * @param {string} src - The script source URL.
	 */
	addScript (id: string, src: string) {
		const body = $('body');
		const element = $(`<script id="${id}" type="text/javascript" src="${src}"></script>`);

		body.find(`script#${id}`).remove();
		body.append(element);
	};

	/**
	 * Converts a Uint8Array to a string.
	 * @param {Uint8Array} u8a - The array to convert.
	 * @returns {string} The resulting string.
	 */
	uint8ToString (u8a: Uint8Array): string {
		const CHUNK = 0x8000;
		const c = [];

		for (let i = 0; i < u8a.length; i += CHUNK) {
			c.push(String.fromCharCode.apply(null, u8a.subarray(i, i + CHUNK)));
		};
		return c.join('');
	};

	/**
	 * Returns the key of an enum for a given value.
	 * @param {any} e - The enum object.
	 * @param {any} v - The value to find.
	 * @returns {string} The key name.
	 */
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

	/**
	 * Removes all HTML tags from a string.
	 * @param {string} s - The string to strip.
	 * @returns {string} The plain string.
	 */
	stripTags (s: string): string {
		return String(s || '').replace(/<[^>]+>/g, '');
	};

	/**
	 * Normalizes line endings in a string to \n.
	 * @param {string} s - The string to normalize.
	 * @returns {string} The normalized string.
	 */
	normalizeLineEndings (s: string) {
		return String(s || '').replace(/\r?\n/g, '\n');
	};

	/**
	 * Escapes HTML special characters in a string.
	 * @param {string} s - The string to escape.
	 * @returns {string} The escaped string.
	 */
	htmlSpecialChars (s: string) {
		return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	};

	/**
	 * Converts HTML special character entities back to characters.
	 * @param {string} s - The string to convert.
	 * @returns {string} The unescaped string.
	 */
	fromHtmlSpecialChars (s: string) {
		return String(s || '').replace(/(&lt;|&gt;|&amp;)/g, (s: string, p: string) => {
			if (p == '&lt;') p = '<';
			if (p == '&gt;') p = '>';
			if (p == '&amp;') p = '&';
			return p;
		});
	};

	/**
	 * Copies computed CSS styles from one element to another.
	 * @param {HTMLElement} src - The source element.
	 * @param {HTMLElement} dst - The destination element.
	 */
	copyCssSingle (src: HTMLElement, dst: HTMLElement) {
		const styles = window.getComputedStyle(src, '');

		if (styles.display && (styles.getPropertyValue('display') == 'none')) {
			return;
		};

		const css: any = [];

		for (let i = 0; i < styles.length; i++) {
			const name = styles[i];
			const value = styles.getPropertyValue(name);

			css[name] = value;
			css.push(`${name}: ${value}`);
		};

		css.push('visibility: visible');

		dst.style.cssText = css.join('; ');
	};

	/**
	 * Recursively copies computed CSS styles from one element and its children to another.
	 * @param {HTMLElement} src - The source element.
	 * @param {HTMLElement} dst - The destination element.
	 */
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

	/**
	 * Shows a browser notification with a title and text, and handles click events.
	 * @param {any} param - The notification parameters (title, text).
	 * @param {function} [onClick] - Optional callback for click event.
	 */
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

	/**
	 * Checks if the app version is an alpha version.
	 * @returns {boolean} True if alpha version, false otherwise.
	 */
	isAlphaVersion (): boolean {
		return !!this.getElectron().version.app.match(/alpha/);
	};

	/**
	 * Checks if the app version is a beta version.
	 * @returns {boolean} True if beta version, false otherwise.
	 */
	isBetaVersion (): boolean {
		return !!this.getElectron().version.app.match(/beta/);
	};

	/**
	 * Checks if a string starts with a right-to-left character.
	 * @param {string} s - The string to check.
	 * @returns {boolean} True if RTL, false otherwise.
	 */
	checkRtl (s: string): boolean {
		return /^[\u0591-\u05EA\u05F0-\u05F4\u0600-\u06FF]/.test(s);
	};

	/**
	 * Converts a string to a URL-friendly slug.
	 * @param {string} s - The string to slugify.
	 * @returns {string} The slugified string.
	 */
	slug (s: string): string {
		return slugify(String(s || ''));
	};

	/**
	 * Renders LaTeX expressions in a string to HTML using KaTeX.
	 * @param {string} html - The HTML string containing LaTeX.
	 * @returns {string} The HTML with rendered LaTeX.
	 */
	getLatex (input: string) {
		if (!input || (input.indexOf('$') < 0)) {
			return input;
		};

		const regex = new RegExp(`\\$([^$<>]+?)\\$`, 'g');
		const match = input.match(regex);

		if (!match) {
			return input;
		};

		const tag = Mark.getTag(I.MarkType.Latex);
		const code = Mark.getTag(I.MarkType.Code);
		const cl = code.length;
		const regCode = new RegExp(`^${code}>|</${code}$`, 'i');
		const render = (s) => {
			try {
				const rendered = katex.renderToString(this.fromHtmlSpecialChars(s), {
					displayMode: false,
					throwOnError: false,
					output: 'html',
					trust: ctx => ALLOWED_KATEX.includes(ctx.command),
				});

				return rendered || s;
			} catch {
				return s;
			};
		};

		let res = input;

		for (let i = 0; i < match.length; ++i) {
			const m = String(match[i] || '');
			const idx = input.indexOf(m);
			const bl = m.length;
			const body = m.substring(1, bl - 1);
			const before = input.substring(idx - cl - 1, idx) || '';
			const after = input.substring(idx + bl + 1, idx + bl + cl + 3) || '';

			// Skip inline code regions
			if (regCode.test(before) || regCode.test(after)) {
				continue;
			};

			// Skip Brazilian Real
			if (!/^\\/.test(body) && (/R$/.test(before) || /R$/.test(body))) {
				continue;
			};

			// Skip if expression starts/ends with space
			if (/^\s/.test(body) || /\s$/.test(body)) {
				continue;
			};

			// Skip escaped \$ signs
			if (/\\$/.test(before) || /\\$/.test(body)) {
				continue;
			};

			res = res.replace(m, `<${tag}>${render(body)}</${tag}>`);
		};

		return res;
	};

	/**
	 * Toggles the open/closed state of an element with animation.
	 * @param {any} obj - The jQuery object to toggle.
	 * @param {number} delay - The animation delay in ms.
	 */
	toggle (obj: any, delay: number, isOpen: boolean, callBack?: () => void) {
		if (isOpen) {
			const height = obj.outerHeight();

			obj.css({ height, overflow: 'hidden' });

			raf(() => obj.addClass('anim').css({ height: 0 }));
			window.setTimeout(() => {
				obj.removeClass('isOpen anim');
				callBack?.();
			}, delay);
		} else {
			obj.css({ height: 'auto' });

			const height = obj.outerHeight();

			obj.css({ height: 0 }).addClass('anim');

			raf(() => obj.css({ height }));
			window.setTimeout(() => {
				obj.removeClass('anim').addClass('isOpen').css({ height: 'auto', overflow: 'visible' });
				callBack?.();
			}, delay);
		};
	};

	/**
	 * Updates an SVG image's attributes and caches the result.
	 * @param {string} src - The SVG source as a base64 string.
	 * @param {any} param - The parameters (id, size, fill, stroke).
	 * @returns {string} The updated SVG as a base64 string.
	 */
	updateSvg (src: string, param: any) {
		const id = String(param.id || '');
		const size = Number(param.size) || 0;
		const fill = String(param.fill || '');
		const stroke = String(param.stroke || '');
		const key = [ id, size, fill, stroke ].join('-');

		if (iconCache.has(key)) {
			return iconCache.get(key);
		};

		let ret = '';
		try {
			const chunk = src.split('base64,')[1];
			const decoded = atob(chunk).replace(/_COLOR_VAR_/g, fill);
			const obj = $(decoded);
			const attr: any = {};

			if (size) {
				attr.width = size;
				attr.height = size;
			};

			if (fill) {
				attr.fill = fill;
			};

			if (stroke) {
				attr.stroke = stroke;
			};

			if (this.objectLength(attr)) {
				obj.attr(attr);
			};
			
			ret = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(obj[0].outerHTML)));
		} catch (e) { /**/ };

		iconCache.set(key, ret);
		return ret;
	};

	/**
	 * Parses a URL and returns a route string for internal navigation.
	 * @param {string} url - The URL to parse.
	 * @returns {string} The route string.
	 */
	getRouteFromUrl (url: string): string {
		url = String(url || '');

		if (!url) {
			return '';
		};

		let ret = '';

		try {
			const u = new URL(url);
			const { hostname, pathname, hash, searchParams, protocol } = u;

			if (protocol == `${J.Constant.protocol}:`) {
				return url.replace(new RegExp(`^${J.Constant.protocol}://`), '/');
			};

			switch (hostname) {
				case 'invite.any.coop': {
					const cid = pathname.replace(/^\//, '');
					const key = hash.replace(/^#/, '');

					ret = `/invite/?cid=${cid}&key=${key}`;
					break;
				};

				case 'object.any.coop': {
					const objectId = pathname.replace(/^\//, '');
					const spaceId = searchParams.get('spaceId');
					const cid = searchParams.get('inviteId');
					const key = hash.replace(/^#/, '');

					ret = `/object/?objectId=${objectId}&spaceId=${spaceId}&cid=${cid}&key=${key}`;
					break;
				};

			};
		} catch (e) { /**/ };

		return ret;
	};

	/**
	 * Returns the background color for an icon option.
	 * @param {number} o - The icon option index.
	 * @returns {string} The background color string.
	 */
	iconBgByOption (o: number): string {
		const { bg, list } = J.Theme.icon;

		o = Number(o) || 0;
		o = Math.max(0, Math.min(list.length, o));

		return bg[list[o - 1]];
	};

	/**
	 * Returns the text color for an icon option.
	 * @param {number} o - The icon option index.
	 * @returns {string} The text color string.
	 */
	iconTextByOption (o: number): string {
		const { text, list } = J.Theme.icon;

		o = Number(o) || 0;
		o = Math.max(0, Math.min(list.length, o));

		return text[list[o - 1]];
	};

	/**
	 * Shows the "What's New" popup and updates storage.
	 */
	showWhatsNew (param?: Partial<I.PopupParam>) {
		param = param || {};
		param.data = param.data || {};
		param.data.document = 'whatsNew';	

		S.Popup.open('help', param);
		Storage.set('whatsNew', false);
	};

	/**
	 * Scrolls to header in Table of contents
	 * @param {string} rootId - The root ID of the page.
	 * @param {any} item - The item to scroll to.
	 * @param {boolean} isPopup - Whether the context is a popup.
	 * @returns {void}
	 */
	scrollToHeader (rootId: string, item: any, isPopup: boolean) {
		const node = $(`.focusable.c${item.id}`);

		if (!node.length) {
			return;
		};

		const container = this.getScrollContainer(isPopup);

		if (item.block && item.block.isTextTitle()) {
			container.scrollTop(0);
			return;
		};

		const toggles = node.parents(`.block.${U.Data.blockTextClass(I.TextStyle.Toggle)}`);

		if (toggles.length) {
			const toggle = $(toggles.get(0));
			if (!toggle.hasClass('isToggled')) {
				S.Block.toggle(rootId, toggle.attr('data-id'), true);
			};
		};

		const no = node.offset().top;
		const st = container.scrollTop();
		const offset = 20;
		const y = Math.max(J.Size.header + offset, no - container.offset().top + st - J.Size.header - offset);

		container.scrollTop(y);
	};

	/**
	 * Lexicographically increments a string using a defined alphabet.
	 * @param {string} s - The string to convert.
	 * @returns {string} The incremented string.
	 */
	lexString (s: string): string {
		const chars = String(s || '').split('');

		let i = chars.length - 1;
		while (i >= 0) {
			const idx = ALPHABET.indexOf(chars[i]);

			if (idx < ALPHABET.length - 1) {
				chars[i] = ALPHABET[idx + 1];
				return chars.join('');
			} else {
				chars[i] = ALPHABET[0];
				i--;
			};
		};

		return ALPHABET[0] + chars.join('');
	};

	/**
	 * Checks if the current app version is different from the provided version.
	 * If different, sets a flag in storage to show the "What's New" popup.
	 * @param {string} v - The version to check against.
	 */
	checkUpdateVersion (v: string) {
		if (!Storage.get('chatsOnboarding')) {
			return;
		};

		v = String(v || '');

		const electron = this.getElectron();
		const update = v.split('.');
		const current = String(electron.version.app || '').split('.');

		if ((update[0] != current[0]) || (update[1] != current[1])) {
			Storage.set('whatsNew', true);
			Storage.setHighlight('whatsNew', true);
		};
	};

	checkCanMembershipUpgrade (): boolean {
		const { membership } = S.Auth;

		return [
			I.TierType.None,
			I.TierType.Explorer,
			I.TierType.Starter,
			I.TierType.Pioneer,
			I.TierType.Free,
			I.TierType.Pro,
			I.TierType.Plus,
			I.TierType.Ultra,
			I.TierType.CoCreator,
		].includes(membership.tier);
	};

	getMembershipPeriodLabel (tier: I.MembershipTier): string {
		// default is year
		let periodLabel = translate('pluralYear');

		if (tier.periodType) {
			switch (tier.periodType) {
				case I.MembershipTierDataPeriodType.PeriodTypeDays: {
					periodLabel = translate('pluralDay');
					break;
				};
				case I.MembershipTierDataPeriodType.PeriodTypeWeeks: {
					periodLabel = translate('pluralWeek');
					break;
				};
				case I.MembershipTierDataPeriodType.PeriodTypeMonths: {
					periodLabel = translate('pluralMonth');
					break;
				};
			};
		};

		return periodLabel;
	};

	calculateStorageUsage (): number {
		const spaces = U.Space.getList();

		let usage = 0;

		(spaces || []).forEach((space) => {
			if (!U.Space.isMyOwner(space.targetSpaceId)) {
				return;
			};

			const object: any = S.Common.spaceStorage.spaces.find(it => it.spaceId == space.targetSpaceId) || {};

			usage += Number(object.bytesUsage) || 0;
		});

		return usage;
	};

	getMaxScrollHeight (isPopup: boolean): number {
		const container = this.getScrollContainer(isPopup);
		if (!container.length) {
			return 0;
		};

		const el = container.get(0);
		return el.scrollHeight - el.clientHeight;
	};

	getAppContainerHeight () {
		return $('#appContainer').height() - Number($('#menuBar.withButtons').outerHeight() || 0);
	};

};

export default new UtilCommon();