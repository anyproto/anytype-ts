import * as React from 'react';
import * as ReactDOM from 'react-dom';

interface Props {
	text: string;
};

const $ = require('jquery');

class EmptySearch extends React.Component<Props, {}> {

	render () {
		const { text } = this.props;
		
		return (
			<div className="emptySearch">
				<div className="txt" dangerouslySetInnerHTML={{ __html: text }} />
			</div>
		);
	};
	
	componentDidMount () {
		this.resize();
	};

	componentDidUpdate () {
		this.resize();
	};

	resize () {
		const node = $(ReactDOM.findDOMNode(this));
		node.css({ lineHeight: node.height() + 'px' });
	};

};

export default EmptySearch;