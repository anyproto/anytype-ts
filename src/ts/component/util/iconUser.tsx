import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Label } from 'ts/component';
import { I, Util } from 'ts/lib';
import { commonStore } from 'ts/store';

interface Props {
	name?: string;
	color?: string;
	icon?: string;
	className?: string;
	avatar?: I.Avatar;
	tooltip?: string;
	tooltipY?: I.MenuDirection;
	onClick?(e: any): void;
	onMouseDown?(e: any): void;
	onMouseEnter?(e: any): void;
	onMouseLeave?(e: any): void;
};

interface State {
	icon: string;
};

const $ = require('jquery');

class IconUser extends React.Component<Props, State> {
	
	_isMounted: boolean = false;
	
	public static defaultProps = {
		color: '',
		tooltipY: I.MenuDirection.Bottom,
	};

	state = {
		icon: '',
	};

	constructor (props: any) {
		super(props);
		
		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { className, avatar, name, color, onClick } = this.props;
		
		let icon = this.state.icon || this.props.icon || '';
		let cn = [ 'icon', 'user' ];
		let style: any = {};
		let text = name || '';
		
		if (className) {
			cn.push(className);
		};
		
		if (avatar) {
			icon = commonStore.imageUrl(avatar.image.hash, 256);
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
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		Util.tooltipHide();
	};
	
	shortName (s: string): string {
		if (!s) {
			return '';
		};
		return s.trim().substr(0, 1);
	};
	
	onMouseEnter (e: any) {
		const { tooltip, tooltipY, onMouseEnter } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		
		if (tooltip) {
			Util.tooltipShow(tooltip, node, tooltipY);
		};
		
		if (onMouseEnter) {
			onMouseEnter(e);
		};
	};
	
	onMouseLeave (e: any) {
		const { onMouseLeave } = this.props;
		
		Util.tooltipHide();
		
		if (onMouseLeave) {
			onMouseLeave(e);
		};
	};
	
	onMouseDown (e: any) {
		const { onMouseDown } = this.props;
		
		Util.tooltipHide();
		
		if (onMouseDown) {
			onMouseDown(e);
		};
	};
	
};

export default IconUser;