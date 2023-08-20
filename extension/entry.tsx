import * as React from 'react';
import * as ReactDOM from 'react-dom';
import $ from 'jquery';
import Popup from './popup';
import Foreground from './foreground';
import Iframe from './iframe';
import Util from './lib/util';
import Extension from 'json/extension.json';

const rootId = `${Extension.clipper.prefix}-root`;
const body = $('body');
const root = $(`<div id="${rootId}"></div>`);

if (!$(`#${rootId}`).length) {
	body.append(root);
};

let component: any = null;
if (Util.isPopup()) {
	component = <Popup />;
} else 
if (Util.isIframe()) {
	component = <Iframe />;
} else {
	component = <Foreground />;
};

ReactDOM.render(component, root.get(0));