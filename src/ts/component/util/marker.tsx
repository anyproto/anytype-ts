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
const Checkbox0 = require('img/icon/marker/check0.svg');
const Checkbox1 = require('img/icon/marker/check1.svg');
const Toggle = require('img/icon/marker/toggle.svg');

for (let c in Constant.textColor) {
	Bullets[c] = require(`img/icon/bullet/${c}.svg`);
};


class Marker extends React.Component<Props, {}> {

	render () {
		const { id, type, color, className, active, onClick } = this.props;
		
		let cn = [ 'marker' ];
		let ci = [ 'markerInner', 'c' + type ];
		let inner: any = null;
		
		if (className) {
			cn.push(className);
		};
		if (active) {
			cn.push('active');
		};
		
		if (color) {
			ci.push('textColor textColor-' + color);
		};
		
		switch (type) {
			case I.TextStyle.Bulleted:
				inner = (
					<span id={'marker-' + id} className={ci.join(' ')}>
						<img src={Bullets[color] || Bullets.black} />
					</span>
				);
				break;
				
			case I.TextStyle.Numbered:
				inner = <span id={'marker-' + id} className={ci.join(' ')} />
				break;
				
			case I.TextStyle.Checkbox:
				inner = <img src={active ? Checkbox1 : Checkbox0} />;
				break;
			
			case I.TextStyle.Toggle:
				inner = <img src={Toggle} />;
				break;
		};
		
		return (
			<div className={cn.join(' ')} onClick={onClick}>
				{inner}
			</div>
		);
	};
	
};

export default Marker;