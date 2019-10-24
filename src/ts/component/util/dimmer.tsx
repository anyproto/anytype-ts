import * as React from 'react';
import * as ReactDOM from 'react-dom';

const $ = require('jquery');
const raf = require('raf');

interface Props {
	onClick?(e: any): void;
};

class Dimmer extends React.Component<Props, {}> {
	
	_isMounted: boolean = false;

	render () {
		const { onClick } = this.props;
		
		return (
			<div id="dimmer" className="dimmer" onClick={onClick} />
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.animate();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};
	
	animate () {
		raf(() => {
			if (!this._isMounted) {
				return;
			};
			
			const node = $(ReactDOM.findDOMNode(this)); 
			node.addClass('show'); 
		});
	};
	
};

export default Dimmer;