import * as React from 'react';
import * as ReactDOM from 'react-dom';

const $ = require('jquery');

interface Props {
	history: any;
};

interface State {
};

class PageMainIndex extends React.Component<Props, State> {

	constructor (props: any) {
        super(props);
	};
	
	render () {
        return (
			<div />
		);
    };

	resize () {
	};

};

export default PageMainIndex;