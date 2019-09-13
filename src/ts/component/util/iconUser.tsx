import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Label } from 'ts/component';

const $ = require('jquery');

interface Props {
	color: string;
	icon: string;
	name: string;
	onClick?(e: any): void;
	onMouseDown?(e: any): void;
	onMouseEnter?(e: any): void;
	onMouseLeave?(e: any): void;
};

class IconUser extends React.Component<Props, {}> {
	
	public static defaultProps = {
        color: 'blue'
    };
	
	constructor (props: any) {
		super(props);
		
		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { icon, name, color, onClick, onMouseDown, onMouseEnter, onMouseLeave } = this.props;
		
		let cn = [ 'icon', 'user' ];
		let style: any = {};
		let text = name || '';
		
		if (icon) {
			text = '';
			style.backgroundImage = 'url("' + icon + '")';
		} else {
			style.backgroundColor = color;
		};
		
		return (
			<div onMouseDown={this.onMouseDown} onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave} onClick={onClick} className={cn.join(' ')}>
				<div className="image" style={style} />
				<div className="txt">{this.shortName(text)}</div>
				<div className="arrow" />
			</div>
		);
	};
	
	shortName (s: string): string {
		if (!s) {
			return '';
		};
		return s.trim().substr(0, 1);
	};
	
	onMouseEnter (e: any) {
		let { onMouseEnter } = this.props;
		let node = $(ReactDOM.findDOMNode(this));
		
		if (onMouseEnter) {
			onMouseEnter(e);
		};
	};
	
	onMouseLeave (e: any) {
		let { onMouseLeave } = this.props;
		
		if (onMouseLeave) {
			onMouseLeave(e);
		};
	};
	
	onMouseDown (e: any) {
		let { onMouseDown } = this.props;
		
		if (onMouseDown) {
			onMouseDown(e);
		};
	};
	
};

export default IconUser;