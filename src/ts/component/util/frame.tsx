import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { UtilCommon } from 'Lib';

interface Props {
	children?: React.ReactNode;
	className?: string;
	dataset?: any;
};

class Frame extends React.Component<Props> {

	_isMounted = false;
	node: any = null;

	render () {
		const { children, className, dataset } = this.props;
		const cn = [ 'frame' ];

		if (className) {
			cn.push(className);
		};

		return (
			<div
				ref={node => this.node = node}
				className={cn.join(' ')}
				{...UtilCommon.dataProps(dataset)}
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