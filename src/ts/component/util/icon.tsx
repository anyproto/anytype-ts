import React, { MouseEvent, forwardRef, useRef, useEffect } from 'react';
import $ from 'jquery';
import { motion, AnimatePresence } from 'motion/react';
import { I, U, Preview } from 'Lib';
import { getIcon } from './icons';

interface Props {
	id?: string;
	name?: string;
	icon?: string;
	color?: string;
	size?: number;
	className?: string;
	arrow?: boolean;
	withBackground?: boolean;
	tooltipParam?: Partial<I.TooltipParam>;
	inner?: any;
	draggable?: boolean;
	style?: any;
	animatePresence?: boolean;
	animationProps?: any;
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
	name = '',
	icon = '',
	color = '',
	size = 20,
	className = '',
	arrow = false,
	withBackground = false,
	tooltipParam = {},
	inner = null,
	draggable = false,
	animatePresence = false,
	animationProps = {},
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
	const SvgComponent = name ? getIcon(name) : null;

	if (icon) {
		style.backgroundImage = `url("${icon}")`;
	};

	const onMouseEnterHandler = (e: MouseEvent) => {
		const { text = '', caption = '' } = tooltipParam;
		const t = Preview.tooltipCaption(text, caption);

		if (t) {
			Preview.tooltipShow({ ...tooltipParam, text: t, element: $(nodeRef.current) });
		};

		onMouseEnter?.(e);
	};

	const onMouseLeaveHandler = (e: MouseEvent) => {
		Preview.tooltipHide(false);
		onMouseLeave?.(e);
	};

	const onMouseDownHandler = (e: MouseEvent) => {
		Preview.tooltipHide(true);
		onMouseDown?.(e);
	};

	const onContextMenuHandler = (e: MouseEvent) => {
		Preview.tooltipHide(true);
		onContextMenu?.(e);
	};

	useEffect(() => {
		return () => Preview.tooltipHide(false);
	}, []);

	let animation = {};
	if (animatePresence) {
		animation = U.Common.animationProps({
			transition: { duration: 0.2, delay: 0.1 },
			...animationProps,
		});
	};

	const nameCn = name ? name.split('/').map((s, i) => i === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1)).join('') : '';
	const colorCn = color ? `iconColor iconColor-${color}` : '';
	const cn = [ 'icon', nameCn, colorCn, className, (withBackground ? 'withBackground' : ''), (SvgComponent ? 'hasSvg' : '') ];

	const element = (
		<motion.div
			ref={ref || nodeRef}
			id={id}
			draggable={draggable}
			className={cn.join(' ')}
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
			{...animation}
		>
			{SvgComponent ? <SvgComponent width={size} height={size} /> : ''}
			{arrow ? <div className="icon arrow" /> : ''}
			{inner}
		</motion.div>
	);

	if (animatePresence) {
		return (
			<AnimatePresence mode="popLayout">
				{element}
			</AnimatePresence>
		);
	};

	return element;

});

export default Icon;
