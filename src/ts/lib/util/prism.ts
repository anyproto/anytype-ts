const Components = require(`prismjs/components.js`);

class UtilPrism {

	map: { [ key: string ]: string } = {};
	aliasMap: { [ key: string ]: string } = {};

	constructor () {
		this.map = this.getMap();
		this.aliasMap = this.getAliasMap();
	};

	/**
	 * Returns an array of dependencies for a given Prism language, in load order.
	 * @param {string} lang - The language key.
	 * @returns {string[]} The array of dependencies.
	 */
	private getDependencies (lang: string): string[] {
		const result = [];
		const language = Components.languages[lang] || {};
		// the type of `require`, `optional`, `alias` is one of `undefined`, `string[]` and `string`
		const requirements = [].concat(language.require || []);
		const optionals = [].concat(language.optional || []);

		requirements.concat(optionals).forEach(item => {
			result.push(...this.getDependencies(item));
		});
		result.push(lang);
		return result;
	};

	/**
	 * Returns an array which is the correct order of loading all Prism components.
	 * @returns {string[]} The ordered list of component keys.
	 */
	get components (): string[] {
		const result = [];
		for (const key in Components.languages) {
			Components.languages[key].title && result.push(...this.getDependencies(key));
		};
		return [ ...new Set(result) ];
	};

	/**
	 * Returns a map of language keys to their display titles.
	 * @returns {object} The map of language keys to titles.
	 */
	private getMap () {
		const result = {};

		for (const key in Components.languages) {
			const lang = Components.languages[key];
			const alias = [].concat(lang.alias || []);
			const titles = lang.aliasTitles || {};

			if (lang.title) {
				result[key] = lang.title;
			};

			alias.forEach((a: string) => {
				result[a] = titles[a] || lang.title;
			});
		};
		return result;
	};

	/**
	 * Returns a map of display titles to arrays of language keys.
	 * @returns {Map<string, string[]>} The value-key map.
	 */
	getValueKeyMap (): Map<string, string[]> {
		const ret: Map<string, string[]> = new Map();
		for (const [ key, value ] of Object.entries(this.map)) {
			ret.set(value, (ret.get(value) || []).concat(key));
		};
		return ret;
	};

	/**
	 * Returns a map of language keys to their canonical alias.
	 * @returns {object} The alias map.
	 */
	getAliasMap () {
		const map = this.getValueKeyMap();
		const result: { [ key: string ]: string } = {};

		for (const [ value, keys ] of map.entries()) {
			keys.sort();
			for (const key of keys) {
				result[key] = keys[0];
			};
		};
		return result;
	};

	/**
	 * Returns an array of language titles and their canonical key.
	 * @returns {{ id: string, name: string }[]} The array of language titles.
	 */
	getTitles () {
		const map = this.getValueKeyMap();
		const result: { id: string; name: string }[] = [];

		for (const [ value, keys ] of map.entries()) {
			keys.sort();
			result.push({ id: keys[0], name: value });
		};
		return result;
	};

};

export default new UtilPrism();