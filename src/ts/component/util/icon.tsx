import React, { MouseEvent, forwardRef, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getIcon } from './icons';
import * as I from 'Interface';

interface Props {
	id?: string;
	name?: string;
	icon?: string;
	color?: string;
	size?: number;
	width?: number;
	height?: number;
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
	width,
	height,
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
	const ArrowComponent = arrow ? getIcon('arrow/button') : null;

	if (icon) {
		style.backgroundImage = `url("${icon}")`;
	};

	const onMouseEnterHandler = (e: MouseEvent) => {
		const { text = '', caption = '' } = tooltipParam;
		const t = Preview.tooltipCaption(text, caption);

		if (t) {
			Preview.tooltipShow({ ...tooltipParam, text: t, element: nodeRef.current });
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

	const nameCn = name ? U.String.toCamelCase(name) : '';
	const colorCn = color ? `iconColor iconColor-${color}` : '';
	const cn = [ 'icon', nameCn, colorCn, className ];
	const w = width || size;
	const h = height || size;

	if (withBackground) {
		cn.push('withBackground');
	};
	if (SvgComponent) {
		cn.push('hasSvg');
	};

	if (SvgComponent && !withBackground && ((w != 20) || (h != 20))) {
		style.width = w;
		style.height = h;
	};

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
			{SvgComponent ? <SvgComponent style={{ width: w, height: h }} /> : ''}
			{ArrowComponent ? <div className="icon arrow hasSvg"><ArrowComponent style={{ width: 8, height: 8 }} /></div> : ''}
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
