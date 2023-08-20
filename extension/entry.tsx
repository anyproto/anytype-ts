import * as React from 'react';
import * as ReactDOM from 'react-dom';
import $ from 'jquery';
import Popup from './popup';
import Iframe from './iframe';
import Util from './lib/util';
import Extension from 'json/extension.json';

import './scss/common.scss';

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

const html = $('html');
const body = $('body');
const root = $(`<div id="${rootId}"></div>`);

if (!$(`#${rootId}`).length) {
	body.append(root);
	html.addClass(rootId);
};

ReactDOM.render(component, root.get(0));