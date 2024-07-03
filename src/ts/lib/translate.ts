import { S, J } from 'Lib';

/**
 * 
 * @param key the key of the text as found in the json/text.json file
 * @returns a piece of display text in the language of the user
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