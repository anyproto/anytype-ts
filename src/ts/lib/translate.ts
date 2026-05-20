import defaultData from 'json/text.json';

type TranslationData = Record<string, string>;

const langModules = import.meta.glob('../../../dist/lib/json/lang/*.json', { eager: true }) as Record<string, { default: TranslationData }>;

/**
 * Translates a key to display text in the user's language.
 * @param {string} key - The key of the text as found in the json/text.json file.
 * @param {string} [force] - Optional language code to force translation.
 * @returns {string} The translated display text.
 * Defaults to the default lang set in constant.json (english)
 */
export const translate = (key: string, force?: string): string => {
	const lang = force || S.Common.interfaceLang;

	let data: TranslationData = defaultData as TranslationData;
	if (lang != J.Constant.default.interfaceLang) {
		const langPath = `../../../dist/lib/json/lang/${lang}.json`;
		const mod = langModules[langPath];
		if (mod) {
			data = (mod.default || mod) as TranslationData;
		};
	};

	return data[key] || (defaultData as TranslationData)[key] || `⚠️${key}⚠️`;
};