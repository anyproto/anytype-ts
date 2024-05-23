import { commonStore } from 'Store';
const Constant = require('json/constant.json');

/**
 * 
 * @param key the key of the text as found in the json/text.json file
 * @returns a piece of display text in the language of the user
 * Defaults to the default lang set in constant.json (english)
 */
export const translate = (key: string, force?: string): string => {
	const lang = force || commonStore.interfaceLang;
	const defaultData = require(`json/text.json`);

	let data = defaultData;
	if (lang == Constant.default.interfaceLang) {
		data = defaultData; 
	} else {
		try { 
			data = require(`lib/json/lang/${lang}.json`);
		} catch(e) {
			data = defaultData; 
		};
	};

	return data[key] || defaultData[key] || `⚠️${key}⚠️`;
};