import { S, J } from 'Lib';

/**
 * Translates a key to display text in the user's language.
 * @param {string} key - The key of the text as found in the json/text.json file.
 * @param {string} [force] - Optional language code to force translation.
 * @returns {string} The translated display text.
 * Defaults to the default lang set in constant.json (english)
 */
export const translate = (key: string, force?: string): string => {
	const lang = force || S.Common.interfaceLang;
	const defaultData = require('json/text.json');

	let data = require('json/text.json');
	if (lang != J.Constant.default.interfaceLang) {
		try { 
			data = require(`lib/json/lang/${lang}.json`);
		} catch(e) {
			data = defaultData; 
		};
	};

	return data[key] || defaultData[key] || `⚠️${key}⚠️`;
};