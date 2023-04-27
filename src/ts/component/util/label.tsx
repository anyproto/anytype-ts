import * as React from 'react';
import $ from 'jquery';
import { I, Util } from 'Lib';

interface Props {
	id?: string;
	text: string;
	className?: string;
	dataset?: any;
	onMouseEnter?: (e: any) => void;
	onMouseLeave?: (e: any) => void;
	onClick?: (e: any) => void;
};

class Label extends React.Component<Props> {

	node: any = null;

	render () {
		const { id, text, className, dataset, onClick } = this.props;
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
				onMouseEnter={this.props.onMouseEnter}
				onMouseLeave={this.props.onMouseLeave}
				{...Util.dataProps({ ...dataset, content: text, 'animation-type': I.AnimType.Text })}
			/>
		);
	};
	
	componentDidMount () {
		Util.renderLinks($(this.node));
	};
	
};

export default Label;