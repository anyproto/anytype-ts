import * as React from 'react';
import $ from 'jquery';
import { I } from 'Lib';
import { commonStore } from 'Store';
import { observer } from 'mobx-react';

import Constant from 'json/constant.json';

interface Props {
	id: string;
	type: any;
	color: string;
	className?: string;
	active: boolean;
	onClick?(): void;
};

const Icons = {
	bullets: {
		default: require('img/icon/bullet/default.svg').default,
	},
	checkbox: {
		0:		 require('img/icon/marker/checkbox0.svg').default,
		1:		 require('img/icon/marker/checkbox1.svg').default,
		2:		 require('img/icon/marker/checkbox2.svg').default,
	},
	task: {
		0:		 require('img/icon/object/checkbox0.svg').default,
		1:		 require('img/icon/object/checkbox1.svg').default,
		2:		 require('img/icon/object/checkbox2.svg').default,
	},
	toggle:		 require('img/icon/marker/toggle.svg').default,
};

for (const c of Constant.textColor) {
	Icons.bullets[c] = require(`img/icon/bullet/${c}.svg`).default;
};

const Theme = {
	dark: {
		bullets: {
			default: require('img/theme/dark/icon/bullet/default.svg').default,
		},
		toggle:		 require('img/theme/dark/icon/marker/toggle.svg').default,
	},
};

const Marker = observer(class Marker extends React.Component<Props> {

	public static defaultProps = {
		color: 'default',
	};
	node = null;

	constructor (props: Props) {
		super(props);

		this.onCheckboxEnter = this.onCheckboxEnter.bind(this);
		this.onCheckboxLeave = this.onCheckboxLeave.bind(this);
	};

	render () {
		const { id, type, color, className, active, onClick } = this.props;
		const { theme } = commonStore;
		const cn = [ 'marker' ];
		const ci = [ 'markerInner', 'c' + type ];

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
			case I.TextStyle.Bulleted: {
				inner = <img src={this.getBullet()} onDragStart={e => e.preventDefault()} />;
				break;
			};
				
			case I.TextStyle.Numbered: {
				inner = <span id={`marker-${id}`} className={ci.join(' ')} />;
				break;
			};
				
			case I.TextStyle.Checkbox: {
				inner = (
					<img 
						src={Icons.checkbox[active ? 2 : 0]} 
						onDragStart={e => e.preventDefault()} 
						onMouseEnter={this.onCheckboxEnter} 
						onMouseLeave={this.onCheckboxLeave} 
					/>
				);
				break;
			};

			case 'checkboxTask': {
				inner = (
					<img 
						src={Icons.task[active ? 2 : 0]} 
						onDragStart={e => e.preventDefault()} 
						onMouseEnter={this.onCheckboxEnter} 
						onMouseLeave={this.onCheckboxLeave} 
					/>
				);
				break;
			};
			
			case I.TextStyle.Toggle: {
				inner = <img src={this.getToggle()} onDragStart={e => e.preventDefault()} />;
				break;
			};
		};
		
		return (
			<div 
				ref={ref => this.node = ref} 
				className={cn.join(' ')} 
				onClick={onClick}
			>
				{inner}
			</div>
		);
	};

	onCheckboxEnter () {
		const { active } = this.props;
		if (!active) {
			$(this.node).find('img').attr({ src: Icons[this.getIconKey()][1] });
		};
	};

	onCheckboxLeave () {
		const { active } = this.props;
		if (!active) {
			$(this.node).find('img').attr({ src: Icons[this.getIconKey()][0] });
		};
	};

	getIconKey () {
		const { type } = this.props;

		let key = '';
		switch (type) {
			case I.TextStyle.Checkbox: key = 'checkbox'; break;
			case 'checkboxTask': key = 'task'; break;
		};
		return key;
	};

	getBullet () {
		const cn = commonStore.getThemeClass();
		const t = Theme[cn];
		const color = this.props.color || 'default';

		return (t && t.bullets[color]) ? t.bullets[color] : Icons.bullets[color];
	};

	getToggle () {
		const cn = commonStore.getThemeClass();
		const t = Theme[cn];

		return (t && t.toggle) ? t.toggle : Icons.toggle;
	};
	
});

export default Marker;