import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, MouseEvent } from 'react';
import { Icon, Loader } from 'Component';
import * as I from 'Interface';

type ButtonSize = 16 | 28 | 32 | 36 | 40 | 48;

interface ButtonProps {
	id?: string;
	type?: string;
	subType?: string;
	icon?: string;
	iconParam?: I.IconParam;
	arrow?: boolean;
	text?: string;
	active?: boolean;
	size?: ButtonSize;
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
	iconParam,
	arrow,
	text = '',
	size,
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

	useEffect(() => setColor(initialColor), [ initialColor ]);
	const cn = [ 'button', color, className, (size ? `size${size}` : '') ];

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
			Preview.tooltipShow({ ...tooltipParam, text: t, element: nodeRef.current });
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
		if (!U.Dom.hasClass(nodeRef.current, 'disabled') && onClick) {
			onClick(e);
		};
	};

	const mouseDownHandler = (e: MouseEvent) => {
		if (!U.Dom.hasClass(nodeRef.current, 'disabled') && onMouseDown) {
			onMouseDown(e);
		};
	};

	useImperativeHandle(ref, () => ({
		setLoading: (v: boolean) => setIsLoading(v),
		isLoading: () => isLoading,
		setDisabled: (v: boolean) => U.Dom.toggleClass(nodeRef.current, 'disabled', v),
		isDisabled: () => U.Dom.hasClass(nodeRef.current, 'disabled'),
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
					{iconParam ? <Icon {...iconParam} /> : icon ? <Icon className={icon} /> : ''}
					<div className="txt" dangerouslySetInnerHTML={{ __html: U.String.sanitize(text) }} />
					{arrow && <div className="arrow" />}
				</div>
			);
		};
	};

	return content;
});

export default Button;