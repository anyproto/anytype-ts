import { dispatcher } from './dispatcher';
import { keyboard, Key } from './keyboard';
import { cache } from './cache';
import Storage from './storage';
import Util from './util';
import DataUtil from './datautil';
import SmileUtil from './smileutil';
import Mark from './mark';
import { focus } from './focus';
import { Encode, Decode } from './struct';
import { scrollOnMove } from './scrollOnMove';
import { analytics } from './analytics';
import { crumbs } from './crumbs';
import * as I from 'ts/interface';
import * as M from 'ts/model';
import * as C from './command';
import * as Response from './response';
import * as Docs from 'ts/docs';

const Constant = require('json/constant.json');
const Text = require('json/text.json');
const lang = Storage.get('lang') || Constant.default.lang;

const translate = (key: string): string => {
	if (!Text[key]) {
		return '*No key - ' + key + '*';
	};
	if (!Text[key][lang]) {
		return '*No lang for key - ' + key + '*';
	};
	return Text[key][lang];
};

export {
	dispatcher,
	keyboard,
	cache,
	focus,
	Key,
	Storage,
	Util,
	DataUtil,
	SmileUtil,
	Mark,
	I,
	C,
	Response,
	M,
	Docs,
	translate,
	analytics,
	crumbs,
	scrollOnMove,
	Encode,
	Decode,
};