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
		let cn = [ 'tag' ];
		
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
			<span className={cn.join(' ')}>
				<span className="inner">
					{text}
				</span>
			</span>
		);
	};
	
	getColor (): string {
		const { text } = this.props;
		
		let n = 0;
		for (let i = 0; i < text.length; i++) {
			n += text.charCodeAt(i);
		};
		return Constant.tagColor[n % Constant.tagColor.length];
	};
	
};

export default Tag;