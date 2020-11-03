import * as React from 'react';
import { Util } from 'ts/lib';

const Constant = require('json/constant.json');

interface Props {
	text?: string;
	className?: string;
	color?: string;
};

class Tag extends React.Component<Props, {}> {

	render () {
		let { text, className, color } = this.props;
		let cn = [ 'tagItem' ];
		
		if (className) {
			cn.push(className);
		};
		if (!color) {
			color = this.getColor();
		};
		if (color) {
			cn.push(color);
		};
		
		return (
			<span contentEditable={false} className={cn.join(' ')}>
				<span className="inner">{text}</span>
			</span>
		);
	};
	
	getColor (): string {
		const a = Object.keys(Constant.textColor);
		
		let text = String(this.props.text || '');
		let n = 0;
		for (let i = 0; i < text.length; i++) {
			n += text.charCodeAt(i);
		};
		return a[n % a.length];
	};
	
};

export default Tag;