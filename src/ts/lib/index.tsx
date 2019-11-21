import { dispatcher } from './dispatcher';
import { keyboard, Key } from './keyboard';
import { cache } from './cache';
import Storage from './storage';
import Util from './util';
import * as I from 'ts/interface';

const lang = require('json/lang.json');
const translate = (key: string): string => {
	return lang[key] || key;
};

export {
	dispatcher,
	keyboard,
	cache,
	Key,
	Storage,
	Util,
	I,
	translate,
};