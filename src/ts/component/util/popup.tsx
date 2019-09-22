import * as React from 'react';
import * as ReactDOM from 'react-dom';

const $ = require('jquery');
const raf = require('raf');

interface Props {
	id: string;
	param?: any;
};

class Popup extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	render () {
		const { id } = this.props;
		let cn = [ 'popup', 'popup-' + id ];
		
		return (
			<div className={cn.join(' ')}>
				{this.props.children}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.resize();
		this.unbind();
		
		$(window).on('resize.popup orientationchange.popup', () => { this.resize(); });
	};
	
	componentWillUnmount () {
		this.unbind();
	};
	
	unbind () {
		$(window).unbind('resize.popup orientationchange.popup');
	};
	
	resize () {
		if (!this._isMounted) {
			return;
		};
		
		raf(() => {
			let node = $(ReactDOM.findDOMNode(this));
			node.css({ 
				marginTop: -node.outerHeight() / 2,
				marginLeft: -node.outerWidth() / 2
			});			
		});
	};
	
};

export default Popup;