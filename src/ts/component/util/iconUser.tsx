import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, Util } from 'ts/lib';
import { commonStore } from 'ts/store';

interface Props {
	name?: string;
	color?: string;
	icon?: string;
	className?: string;
	avatar?: string;
	tooltip?: string;
	tooltipY?: I.MenuDirection;
	onMouseDown?(e: any): void;
	onMouseEnter?(e: any): void;
	onMouseLeave?(e: any): void;
};

const $ = require('jquery');

class IconUser extends React.Component<Props, {}> {
	
	_isMounted: boolean = false;
	
	public static defaultProps = {
		color: '',
		tooltipY: I.MenuDirection.Bottom,
	};

	constructor (props: any) {
		super(props);
		
		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		let  { className, avatar, name, color, icon } = this.props;
		
		let cn = [ 'iconUser' ];
		let text = name || '';
		
		if (className) {
			cn.push(className);
		};
		
		if (avatar) {
			icon = commonStore.imageUrl(avatar, 256);
		};
		
		if (icon) {
			text = '';
		} else {
			cn.push(color);
		};

		return (
			<div onMouseDown={this.onMouseDown} onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave} className={cn.join(' ')}>
				{icon ? <img src={icon} className="image" /> : ''}
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