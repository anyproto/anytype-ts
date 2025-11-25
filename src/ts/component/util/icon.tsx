import React, { MouseEvent, forwardRef, useRef, useEffect } from 'react';
import $ from 'jquery';
import { motion, AnimatePresence } from 'motion/react';
import { I, U, Preview } from 'Lib';

interface Props {
	id?: string;
	icon?: string;
	className?: string;
	arrow?: boolean;
	tooltipParam?: Partial<I.TooltipParam>;
	inner?: any;
	draggable?: boolean;
	style?: any;
	animatePresence?: boolean;
	onClick?(e: MouseEvent): void;
	onDoubleClick?(e: MouseEvent): void;
	onMouseDown?(e: MouseEvent): void;
	onMouseEnter?(e: MouseEvent): void;
	onMouseLeave?(e: MouseEvent): void;
	onMouseMove?(e: MouseEvent): void;
	onDragStart?(e: any): void;
	onDragEnd?(e: any): void;
	onContextMenu?(e: MouseEvent): void;
};

const Icon = forwardRef<HTMLDivElement, Props>(({
	id = '',
	icon = '',
	className = '',
	arrow = false,
	tooltipParam = {},
	inner = null,
	draggable = false,
	animatePresence = false,
	style = {},
	onClick,
	onDoubleClick,
	onMouseDown,
	onMouseEnter,
	onMouseLeave,
	onMouseMove,
	onDragStart,
	onDragEnd,
	onContextMenu,
}, ref) => {

	const nodeRef = useRef<HTMLDivElement>(null);

	if (icon) {
		style.backgroundImage = `url("${icon}")`;
	};

	const onMouseEnterHandler = (e: MouseEvent) => {
		const { text = '', caption = '' } = tooltipParam;
		const t = Preview.tooltipCaption(text, caption);
		
		if (t) {
			Preview.tooltipShow({ ...tooltipParam, text: t, element: $(nodeRef.current) });
		};
		
		if (onMouseEnter) {
			onMouseEnter(e);
		};
	};
	
	const onMouseLeaveHandler = (e: MouseEvent) => {
		Preview.tooltipHide(false);
		
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

	useEffect(() => {
		return () => Preview.tooltipHide(false);
	}, []);

	let animationProps = {};
	if (animatePresence) {
		animationProps = U.Common.animationProps({
			transition: { duration: 0.2, delay: 0.1 },
		});
	};

	return (
		<AnimatePresence mode="popLayout">
			<motion.div
				ref={ref || nodeRef}
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
				onDragEnd={onDragEnd}
				onClick={onClick} 
				onDoubleClick={onDoubleClick}
				{...animationProps}
			>
				{arrow ? <div className="icon arrow" /> : ''}
				{inner}
			</motion.div>
		</AnimatePresence>
	);

});

export default Icon;