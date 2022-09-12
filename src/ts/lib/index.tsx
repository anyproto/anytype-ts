import * as I from 'Interface';
import * as M from 'Model';
import * as C from './command';
import * as Response from './response';
import Mapper from './mapper';
import Renderer from './renderer';

import { dispatcher } from './dispatcher';
import { keyboard, Key } from './keyboard';
import { sidebar } from './sidebar';
import Storage from './storage';
import Util from './util';
import DataUtil from './datautil';
import SmileUtil from './smileutil';
import Mark from './mark';
import Relation from './relation';
import FileUtil from './fileutil';
import Dataview from './dataview';
import { focus } from './focus';
import { Encode, Decode } from './struct';
import { scrollOnMove } from './scrollOnMove';
import { analytics } from './analytics';
import { crumbs } from './crumbs';
import { history } from './history';
import Action from './action';
import Onboarding from './onboarding';
import Survey from './survey';

const Constant = require('json/constant.json');
const Text = require('json/text.json');

const translate = (key: string): string => {
	const lang = Storage.get('lang') || Constant.default.lang;

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
	sidebar,
	focus,
	Key,
	Storage,
	Util,
	DataUtil,
	SmileUtil,
	Mark,
	Relation,
	FileUtil,
	Dataview,
	I,
	C,
	Response,
	M,
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
	Renderer,
	Survey,
};