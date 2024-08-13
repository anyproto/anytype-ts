const Components = require(`prismjs/components.js`);

class UtilPrism {

	map: { [ key: string ]: string } = {};
	aliasMap: { [ key: string ]: string } = {};

	constructor () {
		this.map = this.getMap();
		this.aliasMap = this.getAliasMap();
	};

	private getDependencies (lang: string) {
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

	/** returns an array which is the correct order of loading all Prism components */
	get components (): string[] {
		const result = [];
		for (const key in Components.languages) {
			Components.languages[key].title && result.push(...this.getDependencies(key));
		};
		return [ ...new Set(result) ];
	};

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

	getValueKeyMap (): Map<string, string[]> {
		const ret: Map<string, string[]> = new Map();
		for (const [ key, value ] of Object.entries(this.map)) {
			ret.set(value, (ret.get(value) || []).concat(key));
		};
		return ret;
	};

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