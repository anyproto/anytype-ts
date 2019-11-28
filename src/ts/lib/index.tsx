import { dispatcher } from './dispatcher';
import { keyboard, Key } from './keyboard';
import { cache } from './cache';
import Storage from './storage';
import Util from './util';
import { focus } from './focus';
import * as I from 'ts/interface';
import { StructDecode, StructEncode } from './struct';

const lang = require('json/lang.json');
const translate = (key: string): string => {
	return lang[key] || key;
};

export {
	dispatcher,
	keyboard,
	cache,
	focus,
	Key,
	Storage,
	Util,
	I,
	translate,
	StructDecode, 
	StructEncode,
};