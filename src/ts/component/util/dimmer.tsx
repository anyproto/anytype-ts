import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';

interface Props {
	className?: string;
	onClick?(e: any): void;
};

class Dimmer extends React.Component<Props> {
	
	_isMounted: boolean = false;
	node: any = null;

	render () {
		const { className, onClick } = this.props;
		const cn = [ 'dimmer' ];

		if (className) {
			cn.push(className);
		};
		
		return (
			<div 
				ref={node => this.node = node}
				id="dimmer" className={cn.join(' ')} 
				onClick={onClick} 
			/>
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
			
			$(this.node).addClass('show'); 
		});
	};
	
};

export default Dimmer;