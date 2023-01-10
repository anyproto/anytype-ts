import * as React from 'react';
import $ from 'jquery';
import { Util } from 'Lib';

interface Props {
	id?: string;
	text: string;
	className?: string;
	onClick?: (e: any) => void;
};

class Label extends React.Component<Props> {

	node: any = null;

	render () {
		const { id, text, className, onClick } = this.props;
		const cn = [ 'label' ];

		if (className) {
			cn.push(className);
		};
		
		return (
			<div 
				ref={node => this.node = node}
				id={id} 
				className={cn.join(' ')} 
				dangerouslySetInnerHTML={{ __html: text }} 
				onClick={onClick} 
			/>
		);
	};
	
	componentDidMount () {
		Util.renderLinks($(this.node));
	};
	
};

export default Label;