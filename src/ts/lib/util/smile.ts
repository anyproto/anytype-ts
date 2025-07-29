import { U, J, translate } from 'Lib';
import { init } from 'emoji-mart';

const DIV = 65039;
const CAP = 8419;

class UtilSmile {

	icons: any[] = [];
	cache: any = {};
	aliases: any = {};

	/**
	 * Initializes the emoji data, icons, cache, and aliases.
	 */
	init () {
		init({ data: J.Emoji });

		this.icons = Object.keys(J.Emoji.emojis);

		for (const id in J.Emoji.emojis) {
			const item = J.Emoji.emojis[id];

			for (const skin of item.skins) {
				this.cache[skin.native] = skin.shortcodes;
			};
		};

		for (const k in J.Emoji.aliases) {
			this.aliases[J.Emoji.aliases[k]] = k;
		};
	};

	/**
	 * Returns the native emoji character by its ID and skin tone.
	 * @param {string} id - The emoji ID.
	 * @param {number} skin - The skin tone index.
	 * @returns {string} The native emoji character.
	 */
	nativeById (id: string, skin: number): string {
		if (!id) {
			return '';
		};

		const item = J.Emoji.emojis[id];
		if (!item) {
			return '';
		};

		skin = Number(skin) || 1;
		if (skin > item.skins.length) {
			skin = 1;
		};

		const skinItem = item.skins[(skin - 1)];
		if (!skinItem) {
			return '';
		};

		return skinItem.native;
	};

	/**
	 * Returns a random emoji parameter (id and skin).
	 * @returns {{ id: string, skin: number }} The random emoji parameter.
	 */
	randomParam (): { id: string, skin: number } {
		return { 
			id: this.icons[U.Common.rand(0, this.icons.length - 1)], 
			skin: U.Common.rand(1, 6) 
		};
	};
	
	/**
	 * Returns a random native emoji character.
	 * @returns {string} The random emoji character.
	 */
	random (): string {
		const param = this.randomParam();
		return this.nativeById(param.id, param.skin);
	};

	/**
	 * Returns the image source path for an emoji given its colons code.
	 * @param {string} colons - The emoji colons code.
	 * @returns {string} The image source path.
	 */
	srcFromColons (colons: string) {
		if (!colons) {
			return '';
		};

		const parts = String(colons || '').split('::');
		const id = String(parts[0] || '').replace(/:/g, '');
		const prefix = U.Common.getGlobalConfig().emojiUrl || './img/emoji/';
		const item = J.Emoji.emojis[id];

		if (!item) {
			return '';
		};

		let skin = Number(String(parts[1] || '').replace(/skin-tone-([\d]+):/, '$1')) || 1;
		let code = '';

		if (item.skins && item.skins.length) {
			if (skin > item.skins.length) {
				skin = 1;
			};

			const s = item.skins[(skin - 1)];
			if (s) {
				code = s.unified;
			};
		};

		return `${prefix}${code}.png`;
	};

	/**
	 * Returns the shortcodes for a native emoji character.
	 * @param {string} icon - The native emoji character.
	 * @returns {string} The shortcodes for the emoji.
	 */
	getCode (icon: string) {
		icon = icon.trim();

		if (!icon) {
			return '';
		};

		if (this.cache[icon]) {
			return this.cache[icon];
		};

		icon = icon.replace(/^[\uFE00-\uFE0F]+/g, '');

		const cp = [];
		for (let i = 0; i < icon.length; ++i) {
			cp.push(icon.charCodeAt(i));
		};

		if (!cp.length) {
			return '';
		};

		if (!cp.includes(DIV)) {
			if (cp[cp.length - 1] == CAP) {
				cp.pop();
				cp.push(DIV);
				cp.push(CAP);
			} else {
				cp.push(DIV);
			};

			icon = cp.map(it => String.fromCharCode(it)).join('');
		};

		return this.cache[icon] || '';
	};

	/**
	 * Removes emoji characters from a string.
	 * @param {string} t - The string to strip.
	 * @returns {string} The string without emojis.
	 */
	strip (t: string) {
		const r = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
		return t.replace(r, '');
	};

	/**
	 * Returns the list of emoji categories with translated names.
	 * @returns {any[]} The list of emoji categories.
	 */
	getCategories () {
		return J.Emoji.categories.filter(it => it.id != 'frequent').map(it => ({
			...it,
			name: translate(U.Common.toCamelCase(`emojiCategory-${it.id}`)),
		}));
	};

};

export default new UtilSmile ();