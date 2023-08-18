import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Popup from './popup';
import Foreground from './foreground';
import Util from './lib/util';

const body = document.querySelector('body');
const root = document.createElement('div');

root.id = 'anytypeWebclipperRoot';

if (body) {
	body.appendChild(root);
};

ReactDOM.render(Util.isPopup() ? <Popup /> : <Foreground />, root);