import * as React from 'react';
import * as ReactDOM from 'react-dom';

import 'css/font.css';
import 'css/common.css';

import PageAuthCode from './component/page/auth/code';

class App extends React.Component<{}, {}> {
    
	render () {
        return <PageAuthCode />;
    }
}

ReactDOM.render(<App />, document.getElementById('root'));