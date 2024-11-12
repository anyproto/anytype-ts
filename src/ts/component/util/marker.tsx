import * as React from 'react';
import $ from 'jquery';
import { I, S, U, J } from 'Lib';
import { observer } from 'mobx-react';

interface Props {
	id: string;
	type: any;
	color: string;
	className?: string;
	readonly?: boolean;
	active: boolean;
	onClick?(): void;
};

const Icons = {
	checkbox: {
		0:		 require('img/icon/marker/checkbox0.svg'),
		1:		 require('img/icon/marker/checkbox1.svg'),
		2:		 require('img/icon/marker/checkbox2.svg'),
	},
	task: {
		0:		 require('img/icon/object/checkbox0.svg'),
		1:		 require('img/icon/object/checkbox1.svg'),
		2:		 require('img/icon/object/checkbox2.svg'),
	},
};

const Theme = {
	dark: {
		checkbox: {
			0:		 require('img/icon/marker/checkbox0.svg'),
			1:		 require('img/theme/dark/icon/marker/checkbox1.svg'),
			2:		 require('img/icon/marker/checkbox2.svg'),
		},
		task: {
			0:		 require('img/icon/object/checkbox0.svg'),
			1:		 require('img/theme/dark/icon/object/checkbox1.svg'),
			2:		 require('img/icon/object/checkbox2.svg'),
		},
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
		const { theme } = S.Common;
		const cn = [ 'marker' ];
		const ci = [ 'markerInner', 'c' + type ];

		if (className) {
			cn.push(className);
		};
		if (active) {
			cn.push('active');
		};
		
		if (color) {
			ci.push('textColor textColor-' + color);
		};

		const props = {
			id: `marker-${id}`,
			key: `marker-${id}-${type}`,
			className: ci.join(' '),
		};

		let inner: any = null;

		switch (type) {
			case I.TextStyle.Bulleted: {
				inner = <span {...props} />;
				break;
			};
				
			case I.TextStyle.Numbered: {
				inner = <span {...props} />;
				break;
			};
				
			case I.TextStyle.Checkbox: {
				inner = (
					<img 
						src={this.getCheckbox(active ? 2 : 0)} 
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
						src={this.getTask(active ? 2 : 0)} 
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
		const { active, readonly } = this.props;
		const fn = U.Common.toCamelCase(`get-${this.getIconKey()}`);

		if (!active && this[fn] && !readonly) {
			$(this.node).find('img').attr({ src: this[fn](1) });
		};
	};

	onCheckboxLeave () {
		const { active, readonly } = this.props;
		const fn = U.Common.toCamelCase(`get-${this.getIconKey()}`);

		if (!active && this[fn] && !readonly) {
			$(this.node).find('img').attr({ src: this[fn](0) });
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

	getIcon (type: string) {
		const cn = S.Common.getThemeClass();
		const item = Theme[cn];

		return (item && item[type]) ? item[type] : Icons[type];
	};

	getCheckbox (state: number) {
		return this.getIcon('checkbox')[state];
	};

	getTask (state: number) {
		return this.getIcon('task')[state];
	};

	getToggle () {
		const color = this.props.color || 'default';
		const c = J.Theme[S.Common.getThemeClass()]?.color[color];

		const svg = `
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path fill-rule="evenodd" clip-rule="evenodd" d="M10.2158 7.2226C10.5087 6.92971 10.9835 6.92971 11.2764 7.2226L15.9507 11.8969C16.0093 11.9554 16.0093 12.0504 15.9507 12.109L11.2764 16.7833C10.9835 17.0762 10.5087 17.0762 10.2158 16.7833C9.92287 16.4904 9.92287 16.0155 10.2158 15.7226L13.9354 12.0029L10.2158 8.28326C9.92287 7.99037 9.92287 7.51549 10.2158 7.2226Z" fill="${c}"/>
			</svg>
		`;

		return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
	};

});

export default Marker;