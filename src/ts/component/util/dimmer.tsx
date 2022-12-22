import * as React from 'react';
import * as ReactDOM from 'react-dom';
import $ from 'jquery';
import raf from 'raf';

interface Props {
	className?: string;
	onClick?(e: any): void;
};

class Dimmer extends React.Component<Props, object> {
	
	_isMounted: boolean = false;

	render () {
		const { className, onClick } = this.props;
		
		let cn = [ 'dimmer' ];
		if (className) {
			cn.push(className);
		};
		
		return (
			<div id="dimmer" className={cn.join(' ')} onClick={onClick} />
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