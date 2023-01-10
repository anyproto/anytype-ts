import * as React from 'react';
import * as ReactDOM from 'react-dom';
import $ from 'jquery';
import { Util } from 'Lib';

interface Props {
	id?: string;
	text: string;
	className?: string;
	onClick?: (e: any) => void;
};


class Label extends React.Component<Props, object> {

	render () {
		const { id, text, className, onClick } = this.props;
		const cn = [ 'label' ];

		if (className) {
			cn.push(className);
		};
		
		return (
			<div id={id} className={cn.join(' ')} dangerouslySetInnerHTML={{ __html: text }} onClick={onClick} />
		);
	};
	
	componentDidMount () {
		Util.renderLinks($(this.node));
	};
	
};

export default Label;