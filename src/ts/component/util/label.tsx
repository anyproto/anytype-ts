import * as React from 'react';
import $ from 'jquery';
import { I, UtilCommon } from 'Lib';

interface Props {
	id?: string;
	text: string;
	color?: string;
	className?: string;
	dataset?: any;
	onMouseEnter?: (e: any) => void;
	onMouseLeave?: (e: any) => void;
	onMouseDown?: (e: any) => void;
	onClick?: (e: any) => void;
};

class Label extends React.Component<Props> {

	node: any = null;

	render () {
		const { id, text, color, className, dataset, onClick, onMouseDown, onMouseEnter, onMouseLeave } = this.props;
		const cn = [ 'label' ];

		if (className) {
			cn.push(className);
		};

		if (color) {
			cn.push(`textColor textColor-${color}`);
		};

		return (
			<div 
				ref={node => this.node = node}
				id={id} 
				className={cn.join(' ')} 
				dangerouslySetInnerHTML={{ __html: UtilCommon.sanitize(text) }} 
				onClick={onClick}
				onMouseDown={onMouseDown} 
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
				{...UtilCommon.dataProps({ ...dataset, content: text, 'animation-type': I.AnimType.Text })}
			/>
		);
	};
	
	componentDidMount () {
		UtilCommon.renderLinks($(this.node));
	};
	
};

export default Label;