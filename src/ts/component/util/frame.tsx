import * as React from 'react';
import * as ReactDOM from 'react-dom';

const $ = require('jquery');

class Frame extends React.Component<{}, {}> {

	render () {
		return (
			<div className="frame">
				{this.props.children}
			</div>
		);
	};
	
	componentDidMount () {
		let win = $(window);
		win.unbind('resize.frame orientationchange.frame');
		win.on('resize.frame orientationchange.frame', () => { this.resize(); });
		
		this.resize();
	};
	
	resize () {
		let node = $(ReactDOM.findDOMNode(this));
		node.css({ marginTop: -node.outerHeight() / 2 });	
	};
	
};

export default Frame;