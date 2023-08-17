import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './app';

const body = document.querySelector('body');
const root = document.createElement('div');

root.id = 'anytypeWebclipperRoot';

if (body) {
	body.appendChild(root);
};

ReactDOM.render(<App />, root);