import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { render } from 'react-worker-dom';
import App from './app';

ReactDOM.render(<App />, document.getElementById('root'));