import React, { MouseEvent, forwardRef, useRef, useEffect } from 'react';
import $ from 'jquery';
import { motion, AnimatePresence } from 'motion/react';
import { I, U, Preview } from 'Lib';
import type { IconName } from './iconRegistry';
import { iconRegistry } from './iconRegistry';

/** Try to resolve a CSS class name to a registered icon name.
 *  Converts hyphen-case to camelCase and checks the registry. */
export const resolveIconName = (cls: string): IconName | undefined => {
	if (!cls) {
		return undefined;
	}

	// Direct match
	if (iconRegistry.has(cls as IconName)) {
		return cls as IconName;
	}

	// Convert hyphen-case to camelCase: "settings-personal" → "settingsPersonal"
	const camel = cls.replace(/-([a-zA-Z0-9])/g, (_m, c: string) => c.toUpperCase());
	if (iconRegistry.has(camel as IconName)) {
		return camel as IconName;
	}

	return undefined;
};

interface Props {
	id?: string;
	name?: IconName;
	icon?: string;
	className?: string;
	arrow?: boolean;
	withBackground?: boolean;
	tooltipParam?: Partial<I.TooltipParam>;
	inner?: any;
	draggable?: boolean;
	style?: any;
	animatePresence?: boolean;
	animationProps?: any;
	iconSize?: number;
	iconColor?: string;
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
	name,
	icon = '',
	className = '',
	arrow = false,
	withBackground = false,
	tooltipParam = {},
	inner = null,
	draggable = false,
	animatePresence = false,
	animationProps = {},
	style = {},
	iconSize,
	iconColor,
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

	// Resolve inline SVG from registry only when `name` is explicitly provided.
	// className continues to work via CSS background-image for non-migrated icons.
	let svgElement: React.ReactNode = null;
	if (name) {
		const SvgComponent = iconRegistry.get(name);
		if (SvgComponent) {
			svgElement = <SvgComponent size={iconSize || 20} color={iconColor || 'currentColor'} />;
		};
	}

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

	const cn = [ 'icon', className, (withBackground ? 'withBackground' : ''), (svgElement ? 'withSvg' : '') ];

	return (
		<AnimatePresence mode="popLayout">
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
				{svgElement}
				{arrow ? <div className="icon arrow" /> : ''}
				{inner}
			</motion.div>
		</AnimatePresence>
	);

});

export default Icon;
