import DOMPurify from 'dompurify';
import slugify from '@sindresorhus/slugify';
import parsePhoneNumber from 'libphonenumber-js';
import { I, U, Mark } from 'Lib';

const TEST_HTML = /<[^>]*>/;
const UNSAFE_HTML_PATTERN = /<\s*(script|iframe|svg|img|math|object|embed|style|form|input|video|audio|source)\b|<[^>]+\s+on\w+\s*=|<[^>]+\s+style\s*=\s*["'][^"']*(?:javascript:|data:)|<[^>]+\s+(?:src|href|data|action)\s*=\s*["']?\s*(?:javascript:|data:)|<style[^>]*>[^<]*(?:javascript:|data:)/iu;
const DOMAIN_REGEX = /^(?:[a-zA-Z][a-zA-Z0-9+.-]*:\/\/)?(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[A-Za-z]{2,}(?::\d{1,5})?(?:\/[^\s?#]*)?(?:\?[^\s#]*)?(?:#[^\s]*)?$/;
const URL_REGEX = /^(?:([a-zA-Z][a-zA-Z0-9+.-]*):([^\s]+)|(?:(?:[^:@\s]+(?::[^@\s]*)?@)?(?:localhost|(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)|(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[A-Za-z]{2,}))(?::\d{1,5})?(?:\/[^\s?#]*)?(?:\?[^\s#]*)?(?:#[^\s]*)?)$/i;
const ALLOWED_PROTOCOLS = [ 'mailto', 'tel' ];
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

class UtilString {

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
			} else 
			if (precision == '*') {
				precision = +a[i++];
			} else 
			if (precision.charAt(0) == '*') {
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
	 * Removes a substring from a string between start and end indices.
	 * @param {string} haystack - The original string.
	 * @param {number} start - The start index.
	 * @param {number} end - The end index.
	 * @returns {string} The resulting string.
	 */
	cut (haystack: string, start: number, end: number): string {
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
	insert (haystack: string, needle: string, start: number, end: number): string {
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
	shortMask (s: string, n1: number, n2?: number): string {
		s = String(s || '');
		n2 = Number(n2) || n1;

		const l = s.length;

		if (l <= n1 + n2 + 3) {
			return s;
		};

		let ret = '';
		ret += s.substring(0, n1);
		ret += '...';
		ret += s.substring(l - n2);

		return ret;
	};

	/**
	 * Returns the hostname from a URL without www prefix, or the URL itself if invalid.
	 * @param {string} url - The URL string.
	 * @returns {string} The hostname without www or original URL.
	 */
	shortUrl (url: string, withPath?: boolean): string {
		let a: any = {};
		let p = '';
		try { 
			a = new URL(url); 
			if (withPath) {
				p = U.String.shortMask(a.pathname, 3, 6);
			};
		} catch (e) {};
		return (a.hostname || url).replace(/^www\./, '') + p;
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
	 * Escapes special regex characters in a string.
	 * @param {string} v - The string to escape.
	 * @returns {string} The escaped string.
	 */
	regexEscape (v: string) {
		return String(v || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	};

	/**
	 * Matches a string as a URL.
	 * @param {string} s - The string to match.
	 * @returns {string} The matched URL or empty string.
	 */
	matchUrl (s: string): string {
		const m = String(s || '').match(URL_REGEX);
		const ret = String(((m && m.length) ? m[0] : '') || '').trim();

		try {
			const url = new URL(ret);

			if (!url.host) {
				const protocol = url.protocol.replace(/:$/, '');
				if (!ALLOWED_PROTOCOLS.includes(protocol) && !/^\/\//.test(url.pathname)) {
					return '';
				};
			};
		} catch (e) {};

		return ret;
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
	matchDomain(s: string): string {
		const m = String(s || '').trim().match(DOMAIN_REGEX);
		return m ? m[0] : '';
	};

	/**
	 * Matches a string as a local file path.
	 * @param {string} s - The string to match.
	 * @returns {string} The matched path or empty string.
	 */
	matchPath (s: string): string {
		s = String(s || '');

		// Windows path with backslashes (optionally "file://")
		const rw = /^(file:\/\/)?(?:[a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)\\(?:[\p{L}\p{M}\p{N}\s._%\-(),]+\\)*[\p{L}\p{M}\p{N}\s._%\-(),]+(?:\.[\p{L}\p{M}\p{N}\s_%\-(),]+)?$/ugi;

		// Windows file URI with drive letter + forward slashes, allowing % encodes
		const rwu = /^(file:\/\/\/)(?:[a-zA-Z]:)(?:\/[\p{L}\p{M}\p{N}\s._%\-(),]+)+\/?$/u;

		// POSIX-like file URI/path (your original)
		const ru = /^(file:\/\/\/?)(\/[\p{L}\p{M}\p{N}\s._%\-(),]+)+\/?$/u;

		let m = s.match(rw);
		if (!m) {
			m = s.match(rwu);
		};
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
		const check = parsePhoneNumber(String(s || ''));
		return check && check.isValid() ? check.number : '';
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

		return DOMPurify.sanitize(s, param).toString();
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
			const embedProcessor = isUrl ? U.Embed.getProcessorByUrl(word) : null;

			if (isUrl || isLocal || isEmail || isPhone) {
				const from = text.substring(offset).indexOf(word) + offset;

				offset = from + word.length;
				urls.push({ value: word, from, to: offset, isLocal, isUrl, isEmail, isPhone, embedProcessor });
			};
		};

		return urls;
	};

	/**
	 * Extracts the scheme (protocol) from a URL string.
	 * @param {string} url - The URL string.
	 * @returns {string} The scheme or empty string if invalid.
	 */
	urlScheme (url: string): string {
		try {
			const u = new URL(String(url || ''));
			return u.protocol.replace(/:$/, '');
		} catch {
			return '';
		};
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

		const scheme = this.urlScheme(url);
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
		} else {
			url = `https://${url}`;
		};

		return url;
	};

};

export default new UtilString();