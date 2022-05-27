import { Util } from 'ts/lib';
import { getEmojiDataFromNative } from 'emoji-mart';

const EmojiData = require('json/emoji.json');
const MAX_SIZE = 0x4000;
const SKINS = [ '1F3FA', '1F3FB', '1F3FC', '1F3FD', '1F3FE', '1F3FF' ];
const DIV = 65039;
const CAP = 8419;
const DIV_UNI = '-200d-';

const Mapping = {
	a: 'name',
	b: 'unified',
	c: 'non_qualified',
	d: 'has_img_apple',
	e: 'has_img_google',
	f: 'has_img_twitter',
	g: 'has_img_emojione',
	h: 'has_img_facebook',
	i: 'has_img_messenger',
	j: 'keywords',
	k: 'sheet',
	l: 'emoticons',
	m: 'text',
	n: 'short_names',
	o: 'added_in',
};

class SmileUtil {

	icons: any[] = [];
	cache: any = {};

	constructor () {
		this.icons = Object.keys(EmojiData.emojis);
	};

	unifiedToNative (uni: string): string {
		uni = String(uni || '');
		return uni ? this.stringFromCodePoint(uni.split('-').map((u) => `0x${u}`)) : '';
	};

	stringFromCodePoint (points: any[]): string {
		if (!points.length) {
			return '';
		};

		let codeUnits = [];
		let highSurrogate;
		let lowSurrogate;
		let index = -1;
		let length = points.length;
		let result = '';
		
		while (++index < length) {
			let point = Number(points[index]);
			if (
				!isFinite(point) || // `NaN`, `+Infinity`, or `-Infinity`
				point < 0 || // not a valid Unicode code point
				point > 0x10ffff || // not a valid Unicode code point
				Math.floor(point) != point // not an integer
			) {
				throw RangeError('Invalid code point: ' + point)
			};

			if (point <= 0xffff) {
				// BMP code point
				codeUnits.push(point);
			} else {
				// Astral code point; split in surrogate halves
				// http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae

				point -= 0x10000;
				highSurrogate = (point >> 10) + 0xd800;
				lowSurrogate = (point % 0x400) + 0xdc00;
				codeUnits.push(highSurrogate, lowSurrogate);
			};

			if ((index + 1 === length) || (codeUnits.length > MAX_SIZE)) {
				result += String.fromCharCode.apply(null, codeUnits)
				codeUnits.length = 0;
			};
		};

		return result;
	};

	nativeById (id: string, skin: number): string {
		if (!id) {
			return '';
		};

		const item = this.uncompress(EmojiData.emojis[id]);
		if (!item) {
			return '';
		};

		let uni = item.unified;
		if (item.skin_variations && (skin > 1)) {
			let skinCode = SKINS[(skin - 1)];
			let skinItem = item.skin_variations[skinCode];
			if (skinItem && skinItem.unified) {
				uni = skinItem.unified;
			};
		};
		return this.unifiedToNative(uni);
	};

	uncompress (item: any) {
		for (let key in item) {
			if (!Mapping[key]) {
				continue;
			};
			item[Mapping[key]] = item[key];
			delete(item[key]);
		};
		return item;
	};

	randomParam (): { id: string, skin: number } {
		return { 
			id: this.icons[Util.rand(0, this.icons.length - 1)], 
			skin: Util.rand(1, 6) 
		};
	};
	
	random (): string {
		const param = this.randomParam();
		return this.nativeById(param.id, param.skin);
	};

	srcFromColons (colons: string, skin: number) {
		if (!colons) {
			return '';
		};

		const parts = String(colons || '').split('::');
		const id = String(parts[0] || '').replace(/:/g, '');
		const item = EmojiData.emojis[id];

		if (!item) {
			return '';
		};

		skin = skin || Number(String(parts[1] || '').replace(/skin-([\d]+):/, '$1')) || 0;

		let code: any = String(item.unified || item.b || '').toLowerCase().replace(/-fe0f$/, '');
		if (item.skin_variations && (skin > 1)) {
			code = code.split(DIV_UNI);
			code[0] = [ code[0], SKINS[(skin - 1)].toLowerCase() ].join('-');
			code = code.join(DIV_UNI);
		};

		return `./img/emoji/${code}.png`;
	};

	data (icon: string) {
		icon = icon.trim();

		if (!icon) {
			return {};
		};

		if (this.cache[icon]) {
			return this.cache[icon];
		};

		let cp = [];
		for (let i = 0; i < icon.length; ++i) {
			cp.push(icon.charCodeAt(i));
		};

		if (cp.length && !cp.includes(DIV) && (cp[cp.length - 1] == CAP)) {
			cp.pop();
			cp.push(DIV);
			cp.push(CAP);

			icon = cp.map(it => String.fromCharCode(it)).join('');
		};

		let data: any = null;
		try {
			data = getEmojiDataFromNative(icon, 'apple', EmojiData);

			// Try to get emoji with divider byte
			if (!data) {
				data = getEmojiDataFromNative(icon + String.fromCharCode(DIV), 'apple', EmojiData);
			};
		} catch (e) {};

		if (data) {
			this.cache[icon] = { colons: data.colons, skin: data.skin };
			return this.cache[icon];
		} else {
			return {};
		};
	};

	strip (t: string) {
		const r = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
  		return t.replace(r, '');
	};

};

export default new SmileUtil ();