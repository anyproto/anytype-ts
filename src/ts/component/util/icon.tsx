import * as React from 'react';
import $ from 'jquery';
import { I, Preview } from 'Lib';

interface Props {
	id?: string;
	icon?: string;
	className?: string;
	arrow?: boolean;
	tooltip?: string;
	tooltipCaption?: string;
	tooltipX?: I.MenuDirection.Left | I.MenuDirection.Center | I.MenuDirection.Right;
	tooltipY?: I.MenuDirection.Top | I.MenuDirection.Bottom;
	inner?: any;
	draggable?: boolean;
	style?: any;
	onClick?(e: any): void;
	onMouseDown?(e: any): void;
	onMouseEnter?(e: any): void;
	onMouseLeave?(e: any): void;
	onDragStart?(e: any): void;
	onContextMenu?(e: any): void;
};

class Icon extends React.Component<Props> {
	
	public static defaultProps = {
		tooltipY: I.MenuDirection.Bottom,
	};

	node: any = null;
	
	constructor (props: Props) {
		super(props);

		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
		this.onContextMenu = this.onContextMenu.bind(this);
	};
	
	render () {
		const { id, icon, arrow, draggable, className, inner, onClick, onDragStart } = this.props;
		const cn = [ 'icon' ];
		const style: any = this.props.style || {};
		
		if (className) {
			cn.push(className);
		};
		
		if (icon) {
			style.backgroundImage = `url("${icon}")`;
		};
		
		return (
			<div 
				ref={node => this.node = node}
				id={id} 
				draggable={draggable} 
				onMouseDown={this.onMouseDown} 
				onContextMenu={this.onContextMenu} 
				onMouseEnter={this.onMouseEnter} 
				onMouseLeave={this.onMouseLeave} 
				onClick={onClick} 
				onDragStart={onDragStart} 
				className={cn.join(' ')} 
				style={style}
			>
				{arrow ? <div className="icon arrow" /> : ''}
				{inner ? inner : null}
			</div>
		);
	};

	componentWillUnmount () {
		Preview.tooltipHide(false);
	};
	
	onMouseEnter (e: any) {
		const { tooltip, tooltipCaption, tooltipX, tooltipY, onMouseEnter } = this.props;
		const node = $(this.node);
		const t = Preview.tooltipCaption(tooltip, tooltipCaption);
		
		if (t) {
			Preview.tooltipShow({ text: t, element: node, typeX: tooltipX, typeY: tooltipY });
		};
		
		if (onMouseEnter) {
			onMouseEnter(e);
		};
	};
	
	onMouseLeave (e: any) {
		const { tooltip, onMouseLeave } = this.props;
		
		if (tooltip) {
			Preview.tooltipHide(false);
		};
		
		if (onMouseLeave) {
			onMouseLeave(e);
		};
	};
	
	onMouseDown (e: any) {
		const { onMouseDown } = this.props;
		
		Preview.tooltipHide(true);
		
		if (onMouseDown) {
			onMouseDown(e);
		};
	};

	onContextMenu (e: any) {
		const { onContextMenu } = this.props;
		
		Preview.tooltipHide(true);
		
		if (onContextMenu) {
			onContextMenu(e);
		};
	};
	
};

export default Icon;