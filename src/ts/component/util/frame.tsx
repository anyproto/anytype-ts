import * as React from 'react';
import * as ReactDOM from 'react-dom';
import $ from 'jquery';
import raf from 'raf';

class Frame extends React.Component<object, object> {

	_isMounted: boolean = false;

	render () {
		const { children } = this.props;

		return (
			<div className="frame">
				{children}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.resize();
		this.unbind();
		
		$(window).on('resize.frame', () => { this.resize(); });
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};
	
	unbind () {
		$(window).off('resize.frame');
	};
	
	resize () {
		raf(() => {
			if (!this._isMounted) {
				return;
			};
			
			const node = $(this.node);
			node.css({ 
				marginTop: -node.outerHeight() / 2,
				marginLeft: -node.outerWidth() / 2
			});
		});
	};
	
};

export default Frame;