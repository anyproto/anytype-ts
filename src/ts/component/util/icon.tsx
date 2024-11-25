import React, { MouseEvent, DragEvent, forwardRef, useRef, useEffect } from 'react';
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
	tooltipClassName?: string;
	inner?: any;
	draggable?: boolean;
	style?: any;
	onClick?(e: MouseEvent): void;
	onMouseDown?(e: MouseEvent): void;
	onMouseEnter?(e: MouseEvent): void;
	onMouseLeave?(e: MouseEvent): void;
	onMouseMove?(e: MouseEvent): void;
	onDragStart?(e: DragEvent): void;
	onContextMenu?(e: MouseEvent): void;
};

const Icon = forwardRef<HTMLDivElement, Props>(({
	id = '',
	icon = '',
	className = '',
	arrow = false,
	tooltip = '',
	tooltipCaption = '',
	tooltipX = I.MenuDirection.Center,
	tooltipY = I.MenuDirection.Bottom,
	tooltipClassName = '',
	inner = null,
	draggable = false,
	style = {},
	onClick,
	onMouseDown,
	onMouseEnter,
	onMouseLeave,
	onMouseMove,
	onDragStart,
	onContextMenu,
}, ref) => {

	const nodeRef = useRef<HTMLDivElement>(null);

	if (icon) {
		style.backgroundImage = `url("${icon}")`;
	};

	useEffect(() => Preview.tooltipHide(false));

	const onMouseEnterHandler = (e: MouseEvent) => {
		const t = Preview.tooltipCaption(tooltip, tooltipCaption);
		
		if (t) {
			Preview.tooltipShow({ text: t, element: $(nodeRef.current), typeX: tooltipX, typeY: tooltipY, className: tooltipClassName });
		};
		
		if (onMouseEnter) {
			onMouseEnter(e);
		};
	};
	
	const onMouseLeaveHandler = (e: MouseEvent) => {
		if (tooltip) {
			Preview.tooltipHide(false);
		};
		
		if (onMouseLeave) {
			onMouseLeave(e);
		};
	};
	
	const onMouseDownHandler = (e: MouseEvent) => {
		Preview.tooltipHide(true);
		
		if (onMouseDown) {
			onMouseDown(e);
		};
	};

	const onContextMenuHandler = (e: MouseEvent) => {
		Preview.tooltipHide(true);
		
		if (onContextMenu) {
			onContextMenu(e);
		};
	};

	return (
		<div 
			ref={nodeRef}
			id={id} 
			draggable={draggable} 
			className={[ 'icon', className ].join(' ')} 
			style={style}
			onMouseDown={onMouseDownHandler} 
			onMouseEnter={onMouseEnterHandler} 
			onMouseLeave={onMouseLeaveHandler} 
			onMouseMove={onMouseMove}
			onContextMenu={onContextMenuHandler} 
			onDragStart={onDragStart} 
			onClick={onClick} 
		>
			{arrow ? <div className="icon arrow" /> : ''}
			{inner}
		</div>
	);

});

export default Icon;