import * as React from 'react';
import { I } from 'ts/lib';
import { commonStore } from 'ts/store';

interface Props {
	id: string;
	type: any;
	color: string;
	className?: string;
	active: boolean;
	onClick?(): void;
};

const Constant = require('json/constant.json');
const Icons = {
	bullets: {
		default: require('img/icon/bullet/default.svg'),
	},
	checkbox: {
		0:		 require('img/icon/marker/checkbox0.svg'),
		1:		 require('img/icon/marker/checkbox1.svg'),
	},
	task: {
		0:		 require('img/icon/object/checkbox0.svg'),
		1:		 require('img/icon/object/checkbox1.svg'),
	},
	toggle:		 require('img/icon/marker/toggle.svg'),
};

for (let c of Constant.textColor) {
	Icons.bullets[c] = require(`img/icon/bullet/${c}.svg`);
};

const Theme = {
	dark: {
		bullets: {
			default: require('img/theme/dark/icon/bullet/default.svg'),
		},
		toggle:		 require('img/theme/dark/icon/marker/toggle.svg'),
	},
};

class Marker extends React.Component<Props, {}> {

	public static defaultProps = {
		color: 'default',
	};

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
				inner = <img src={this.getBullet()} />
				break;
				
			case I.TextStyle.Numbered:
				inner = <span id={'marker-' + id} className={ci.join(' ')} />
				break;
				
			case I.TextStyle.Checkbox:
				inner = <img src={Icons.checkbox[Number(active)]} />;
				break;

			case 'checkboxTask':
				inner = <img src={Icons.task[Number(active)]} />;
				break;
			
			case I.TextStyle.Toggle:
				inner = <img src={this.getToggle()} />;
				break;
		};
		
		return (
			<div className={cn.join(' ')} onClick={onClick}>
				{inner}
			</div>
		);
	};

	getBullet () {
		const { theme } = commonStore;
		const t = Theme[theme];
		const color = this.props.color || 'default';

		return (t && t.bullets[color]) ? t.bullets[color] : Icons.bullets[color];
	};

	getToggle () {
		const { theme } = commonStore;
		const t = Theme[theme];

		return (t && t.toggle) ? t.toggle : Icons.toggle;
	};
	
};

export default Marker;