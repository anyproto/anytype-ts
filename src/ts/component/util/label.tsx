import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Util } from 'Lib';

interface Props {
	id?: string;
	text: string;
	className?: string;
	onClick?: (e: any) => void;
};

const $ = require('jquery');

class Label extends React.Component<Props, {}> {

	render () {
		const { id, text, className, onClick } = this.props;
		
		let cn = [ 'label' ];
		if (className) {
			cn.push(className);
		};
		
		return (
			<div id={id} className={cn.join(' ')} dangerouslySetInnerHTML={{ __html: text }} onClick={onClick} />
		);
	};
	
	componentDidMount () {
		Util.renderLinks($(ReactDOM.findDOMNode(this)));
	};
	
};

export default Label;