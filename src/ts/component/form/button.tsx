import React, { useState, useRef, forwardRef, useImperativeHandle, MouseEvent } from 'react';
import $ from 'jquery';
import { I, U, Preview } from 'Lib';
import { Icon, Loader } from 'Component';

interface ButtonProps {
	id?: string;
	type?: string;
	subType?: string;
	icon?: string;
	arrow?: boolean;
	text?: string;
	color?: string;
	className?: string;
	tooltip?: string;
	tooltipX?: I.MenuDirection.Left | I.MenuDirection.Center | I.MenuDirection.Right;
	tooltipY?: I.MenuDirection.Top | I.MenuDirection.Center | I.MenuDirection.Bottom;
	dataset?: Record<string, string>;
	onClick?: (e: MouseEvent) => void;
	onMouseEnter?: (e: MouseEvent) => void;
	onMouseLeave?: (e: MouseEvent) => void;
	onMouseDown?: (e: MouseEvent) => void;
};

export interface ButtonRef {
	setLoading: (v: boolean) => void;
	setDisabled: (v: boolean) => void;
	isDisabled: () => boolean;
};

const Button = forwardRef<ButtonRef, ButtonProps>(({
	id,
	type = 'button',
	subType = 'submit',
	icon,
	arrow,
	text = '',
	color = 'black',
	className = '',
	tooltip,
	tooltipX,
	tooltipY = I.MenuDirection.Bottom,
	onClick,
	onMouseEnter,
	onMouseLeave,
	onMouseDown,
	dataset
}, ref) => {
	const [ isLoading, setIsLoading ] = useState(false);
	const nodeRef = useRef<HTMLDivElement | HTMLInputElement>(null);
	const cn = [ 'button', color, className ];

	let content = null;

	if (isLoading) {
		cn.push('isLoading');
	};

	const handleMouseEnter = (e: MouseEvent) => {
		if (tooltip) {
			Preview.tooltipShow({ text: tooltip, element: $(nodeRef.current), typeX: tooltipX, typeY: tooltipY });
		};

		if (onMouseEnter) { 
			onMouseEnter(e);
		};
	};

	const handleMouseLeave = (e: MouseEvent) => {
		Preview.tooltipHide(false);

		if (onMouseLeave) { 
			onMouseLeave(e); 
		};
	};

	const handleClick = (e: MouseEvent) => {
		if (!$(nodeRef.current).hasClass('disabled') && onClick) {
			onClick(e);
		};
	};

	const handleMouseDown = (e: MouseEvent) => {
		if (!$(nodeRef.current).hasClass('disabled') && onMouseDown) {
			onMouseDown(e);
		};
	};

	useImperativeHandle(ref, () => ({
		setLoading: (v: boolean) => setIsLoading(v),
		setDisabled: (v: boolean) => {
			const node = $(nodeRef.current);
			v ? node.addClass('disabled') : node.removeClass('disabled');
		},
		isDisabled: () => $(nodeRef.current).hasClass('disabled'),
		isLoading: () => isLoading,
	}));

	switch (type) {
		case 'input': {
			content = (
				<input
					ref={nodeRef}
					id={id}
					type={subType}
					value={text}
					className={cn.join(' ')}
					onMouseDown={handleClick}
					onMouseEnter={handleMouseEnter}
					onMouseLeave={handleMouseLeave}
					{...U.Common.dataProps(dataset)}
				/>
			);
			break;
		};

		default: {
			content = (
				<div
					ref={nodeRef}
					id={id}
					className={cn.join(' ')}
					onClick={handleClick}
					onMouseDown={handleMouseDown}
					onMouseEnter={handleMouseEnter}
					onMouseLeave={handleMouseLeave}
					{...U.Common.dataProps(dataset)}
				>
					{isLoading && <Loader />}
					{icon && <Icon className={icon} />}
					<div className="txt" dangerouslySetInnerHTML={{ __html: U.Common.sanitize(text) }} />
					{arrow && <div className="arrow" />}
				</div>
			);
		};
	};

	return content;
});

export default Button;