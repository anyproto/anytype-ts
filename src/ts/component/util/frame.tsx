import * as React from 'react';
import * as ReactDOM from 'react-dom';

const $ = require('jquery');
const raf = require('raf');

class Frame extends React.Component<{}, {}> {

	_isMounted: boolean = false;

	render () {
		return (
			<div className="frame">
				{this.props.children}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.resize();
		this.unbind();
		
		$(window).on('resize.frame orientationchange.frame', () => { this.resize(); });
	};
	
	componentWillUnmount () {
		this.unbind();
	};
	
	unbind () {
		$(window).unbind('resize.frame orientationchange.frame');
	};
	
	resize () {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		raf(() => {
			node.css({ 
				marginTop: -node.outerHeight() / 2,
				marginLeft: -node.outerWidth() / 2
			});
		});
	};
	
};

export default Frame;