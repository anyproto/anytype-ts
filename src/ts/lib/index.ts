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
import FileUtil from './fileutil';
import ObjectUtil from './objectutil';
import MenuUtil from './menuutil';
import Mark from './mark';
import Relation from './relation';
import Dataview from './dataview';
import { focus } from './focus';
import { Encode, Decode } from './struct';
import { scrollOnMove } from './scrollOnMove';
import { analytics } from './analytics';
import { history } from './history';
import Action from './action';
import Onboarding from './onboarding';
import Survey from './survey';
import Preview from './preview';
import Highlight from './highlight';
import Animation from './animation';

import Constant from 'json/constant.json';
import Text from 'json/text.json';


/**
 * 
 * @param key the key of the text as found in the json/text.json file
 * @returns a piece of display text in the language of the user
 * Defaults to the default lang set in constant.json (english)
 */
const translate = (key: keyof typeof Text | Omit<string, keyof typeof Text>): string => {
	const lang = Storage.get('lang') || Constant.default.lang;

	if (undefined === Text[key as string]) {
		return `*No key: ${key}*`;
	};

	if (undefined === Text[key as string][lang]) {
		return `*No ${lang}: ${key}*`;
	};
	return Text[key as string][lang];
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
	FileUtil,
	ObjectUtil,
	MenuUtil,
	Mark,
	Relation,
	Dataview,
	I,
	C,
	Response,
	M,
	translate,
	analytics,
	history,
	scrollOnMove,
	Encode,
	Decode,
	Mapper,
	Action,
	Onboarding,
	Renderer,
	Survey,
	Preview,
	Highlight,
	Animation,
};