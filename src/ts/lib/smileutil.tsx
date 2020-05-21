import { Util } from 'ts/lib';
import { getEmojiDataFromNative } from 'emoji-mart';

const $ = require('jquery');
const EmojiData = require('emoji-mart/data/apple.json');
const MAX_SIZE = 0x4000;
const SKINS = [ '1F3FA', '1F3FB', '1F3FC', '1F3FD', '1F3FE', '1F3FF' ];

class SmileUtil {

	icons: any[] = [];
	cache: any = {};

	constructor () {
		this.icons = Object.keys(EmojiData.emojis);
	};

	unifiedToNative (uni: string): string {
		return this.stringFromCodePoint(uni.split('-').map((u) => `0x${u}`));
	};

	stringFromCodePoint (points: any[]) {
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

		const item = EmojiData.emojis[id];
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
	
	random (): string {
		const id = this.icons[Util.rand(0, this.icons.length - 1)];
		const skin = Util.rand(1, 6);
		return this.nativeById(id, skin);
	};

	srcFromColons (colons: string, skin: number) {
		let parts = colons.split('::');
		if (parts.length > 1) {
			parts[1] = parts[1].replace('skin-tone-', 'type-');
		} else
		if (skin) {
			parts.push('type-' + skin);
		};

		let src = parts.join('-').replace(/:/g, '').replace(/_/g, '-');
		return `./emoji/${src}.png`;
	};

	data (icon: string) {
		if (!icon) {
			return {};
		};

		if (this.cache[icon]) {
			return this.cache[icon];
		};

		const data = getEmojiDataFromNative(icon, 'apple', EmojiData);
		if (data) {
			this.cache[icon] = { 
				colons: data.colons, 
				skin: data.skin 
			};
			return this.cache[icon];
		} else {
			return {};
		};
	};

};

export default new SmileUtil ();