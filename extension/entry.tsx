import * as React from 'react';
import * as ReactDOM from 'react-dom';
import $ from 'jquery';
import { C, U, J, S } from 'Lib'; 
import Popup from './popup';
import Iframe from './iframe';
import Auth from './auth';
import Util from './lib/util';

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
	Lib: {
		C,
		U,
		S,
	},
};

window.AnytypeGlobalConfig = { 
	emojiUrl: J.Extension.clipper.emojiUrl, 
	menuBorderTop: 16, 
	menuBorderBottom: 16,
	flagsMw: { request: true },
};

let rootId = '';
let component: any = null;

if (Util.isPopup()) {
	rootId = `${J.Extension.clipper.prefix}-popup`;
	component = <Popup />;
} else 
if (Util.isIframe()) {
	rootId = `${J.Extension.clipper.prefix}-iframe`;
	component = <Iframe />;
} else 
if (Util.isAuth()) {
	rootId = `${J.Extension.clipper.prefix}-auth`;
	component = <Auth />;
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