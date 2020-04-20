import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I } from 'ts/lib';

interface Props {
	id: string;
	type: I.TextStyle;
	color: string;
	className?: string;
	active: boolean;
	onClick?(): void;
};

const Constant = require('json/constant.json');
const Bullets = {
	black:	 require('img/icon/bullet/black.svg'),
};

for (let c in Constant.textColor) {
	Bullets[c] = require(`img/icon/bullet/${c}.svg`);
};


class Marker extends React.Component<Props, {}> {

	render () {
		const { id, type, color, className, active, onClick } = this.props;
		
		let cn = [ 'marker' ];
		let ci = [ 'markerInner', 'c' + type ];
		
		if (className) {
			cn.push(className);
		};
		if (active) {
			cn.push('active');
		};
		
		if (color) {
			ci.push('textColor textColor-' + color);
		};
		
		let inner: any = null;
		
		if (type == I.TextStyle.Bulleted) {
			inner = <img src={Bullets[color] || Bullets.black} />;
		};
		
		return (
			<div className={cn.join(' ')} onClick={onClick}>
				<span id={'marker-' + id} className={ci.join(' ')}>{inner}</span>
			</div>
		);
	};
	
};

export default Marker;