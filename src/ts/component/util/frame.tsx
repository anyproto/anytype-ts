import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';

class Frame extends React.Component {

	_isMounted: boolean = false;
	node: any = null;

	render () {
		const { children } = this.props;

		return (
			<div
				ref={node => this.node = node}
				className="frame"
			>
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