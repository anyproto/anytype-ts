import * as React from 'react';
import $ from 'jquery';
import { I, Util } from 'Lib';

interface Props {
	id?: string;
	text: string;
	className?: string;
	dataset?: any;
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

		dataset.content = text;
		dataset['animation-type'] = I.AnimType.Text;
		
		return (
			<div 
				ref={node => this.node = node}
				id={id} 
				className={cn.join(' ')} 
				dangerouslySetInnerHTML={{ __html: text }} 
				onClick={onClick} 
				{...Util.dataProps(dataset)}
			/>
		);
	};
	
	componentDidMount () {
		Util.renderLinks($(this.node));
	};
	
};

export default Label;