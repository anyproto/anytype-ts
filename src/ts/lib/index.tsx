import * as I from 'ts/interface';
import * as M from 'ts/model';
import * as C from './command';
import * as Response from './response';
import Mapper from './mapper';

import { dispatcher } from './dispatcher';
import { keyboard, Key } from './keyboard';
import Storage from './storage';
import Util from './util';
import DataUtil from './datautil';
import SmileUtil from './smileutil';
import Mark from './mark';
import Relation from './relation';
import { focus } from './focus';
import { Encode, Decode } from './struct';
import { scrollOnMove } from './scrollOnMove';
import { analytics } from './analytics';
import { crumbs } from './crumbs';
import { history } from './history';
import Action from './action';
import * as Docs from 'ts/docs';
import Onboarding from './onboarding';

const Constant = require('json/constant.json');
const Text = require('json/text.json');
const lang = Storage.get('lang') || Constant.default.lang;

const translate = (key: string): string => {
	if (undefined === Text[key]) {
		return `*No key: ${key}*`;
	};
	if (undefined === Text[key][lang]) {
		return `*No ${lang}: ${key}*`;
	};
	return Text[key][lang];
};

export {
	dispatcher,
	keyboard,
	focus,
	Key,
	Storage,
	Util,
	DataUtil,
	SmileUtil,
	Mark,
	Relation,
	I,
	C,
	Response,
	M,
	Docs,
	translate,
	analytics,
	crumbs,
	history,
	scrollOnMove,
	Encode,
	Decode,
	Mapper,
	Action,
	Onboarding,
};