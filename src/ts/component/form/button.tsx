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
	active?: boolean;
	color?: string;
	className?: string;
	tooltipParam?: Partial<I.TooltipParam>;
	dataset?: Record<string, string>;
	onClick?: (e: MouseEvent) => void;
	onMouseEnter?: (e: MouseEvent) => void;
	onMouseLeave?: (e: MouseEvent) => void;
	onMouseDown?: (e: MouseEvent) => void;
};

interface ButtonRef {
	setLoading: (v: boolean) => void;
	isLoading: () => boolean;
	setDisabled: (v: boolean) => void;
	isDisabled: () => boolean;
	setColor: (color: string) => void;
	getColor: () => string;
	getNode: () => HTMLDivElement | HTMLInputElement;
};

const Button = forwardRef<ButtonRef, ButtonProps>(({
	id,
	type = 'button',
	subType = 'submit',
	icon,
	arrow,
	text = '',
	color: initialColor = 'black',
	className = '',
	tooltipParam = {},
	onClick,
	onMouseEnter,
	onMouseLeave,
	onMouseDown,
	dataset,
	active,
}, ref) => {
	const [ isLoading, setIsLoading ] = useState(false);
	const [ color, setColor ] = useState(initialColor);
	const nodeRef = useRef<HTMLDivElement | HTMLInputElement>(null);
	const cn = [ 'button', color, className ];

	let content = null;

	if (isLoading) {
		cn.push('isLoading');
	};

	if (active) {
		cn.push('active');
	};

	const mouseEnterHandler = (e: MouseEvent) => {
		const { text = '', caption = '' } = tooltipParam;
		const t = Preview.tooltipCaption(text, caption);

		if (t) {
			Preview.tooltipShow({ ...tooltipParam, text: t, element: $(nodeRef.current) });
		};

		if (onMouseEnter) { 
			onMouseEnter(e);
		};
	};

	const mouseLeaveHandler = (e: MouseEvent) => {
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

	const mouseDownHandler = (e: MouseEvent) => {
		if (!$(nodeRef.current).hasClass('disabled') && onMouseDown) {
			onMouseDown(e);
		};
	};

	useImperativeHandle(ref, () => ({
		setLoading: (v: boolean) => setIsLoading(v),
		isLoading: () => isLoading,
		setDisabled: (v: boolean) => $(nodeRef.current).toggleClass('disabled', v),
		isDisabled: () => $(nodeRef.current).hasClass('disabled'),
		setColor,
		getColor: () => color,
		getNode: () => nodeRef.current,
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
					onMouseEnter={mouseEnterHandler}
					onMouseLeave={mouseLeaveHandler}
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
					onMouseDown={mouseDownHandler}
					onMouseEnter={mouseEnterHandler}
					onMouseLeave={mouseLeaveHandler}
					{...U.Common.dataProps(dataset)}
				>
					{isLoading && <Loader />}
					{icon && <Icon className={icon} />}
					<div className="txt" dangerouslySetInnerHTML={{ __html: U.String.sanitize(text) }} />
					{arrow && <div className="arrow" />}
				</div>
			);
		};
	};

	return content;
});

export default Button;