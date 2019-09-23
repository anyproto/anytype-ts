import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Label } from 'ts/component';
import { AccountInterface } from 'ts/store/auth';

interface Props {
	name?: string;
	color?: string;
	icon?: string;
	className?: string;
	onClick?(e: any): void;
	onMouseDown?(e: any): void;
	onMouseEnter?(e: any): void;
	onMouseLeave?(e: any): void;
};

class IconUser extends React.Component<Props, {}> {
	
	public static defaultProps = {
        color: 'grey'
    };
	
	constructor (props: any) {
		super(props);
		
		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { className, icon, name, color, onClick, onMouseDown, onMouseEnter, onMouseLeave } = this.props;
		
		let cn = [ 'icon', 'user' ];
		let style: any = {};
		let text = name || '';
		
		if (className) {
			cn.push(className);
		};
		
		if (icon) {
			text = '';
			style.backgroundImage = 'url("' + icon + '")';
		} else {
			cn.push(color);
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