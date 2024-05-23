import * as React from 'react';
import * as ReactDOM from 'react-dom';
import $ from 'jquery';
import { C, UtilCommon, UtilRouter } from 'Lib'; 
import Popup from './popup';
import Iframe from './iframe';
import Util from './lib/util';
const Extension = require('json/extension.json');
import * as Store from 'Store';

import './scss/common.scss';

declare global {
	interface Window {
		isExtension: boolean;
		Electron: any;
		$: any;
		Anytype: any;
		isWebVersion: boolean;
		AnytypeGlobalConfig: any;
	}
};

window.$ = $;
window.isExtension = true;
window.Electron = {
	currentWindow: () => ({}),
	Api: () => {},
	platform: '',
};

window.Anytype = {
	Store,
	Lib: {
		C,
		UtilCommon,
		UtilRouter, 
	},
};

window.AnytypeGlobalConfig = { 
	emojiUrl: Extension.clipper.emojiUrl, 
	menuBorderTop: 16, 
	menuBorderBottom: 16, 
	debug: { mw: false },
};

let rootId = '';
let component: any = null;

if (Util.isPopup()) {
	rootId = `${Extension.clipper.prefix}-popup`;
	component = <Popup />;
} else 
if (Util.isIframe()) {
	rootId = `${Extension.clipper.prefix}-iframe`;
	component = <Iframe />;
};

if (!rootId) {
	console.error('[Entry] rootId is not defined');
} else {
	const html = $('html');
	const body = $('body');
	const root = $(`<div id="${rootId}"></div>`);

	if (!$(`#${rootId}`).length) {
		body.append(root);
		html.addClass(rootId);
	};

	ReactDOM.render(component, root.get(0));
};