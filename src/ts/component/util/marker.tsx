import React, { forwardRef, useRef, useState } from 'react';
import { getIcon } from './icons';
import * as I from 'Interface';

interface Props {
	id: string;
	type: I.MarkerType;
	color: string;
	className?: string;
	readonly?: boolean;
	active?: boolean;
	onClick?(e: any): void;
	onMouseDown?(e: any): void;
};

const CheckboxIcons = [
	getIcon('marker/checkbox0'),
	getIcon('marker/checkbox1'),
	getIcon('marker/checkbox2'),
];

const Marker = forwardRef<HTMLDivElement, Props>(({
	id = '',
	type = I.MarkerType.Bulleted,
	color = 'default',
	className = '',
	active = false,
	readonly = false,
	onClick,
	onMouseDown,
}, ref) => {

	const colorValue = color || 'default';
	const refNode = useRef<HTMLDivElement>(null);
	const [ hovered, setHovered ] = useState(false);
	const cn = [ 'marker', `marker${I.MarkerType[type]}` ];

	if (className) {
		cn.push(className);
	};
	const ci = [ 'markerInner', `marker${I.MarkerType[type]}`, `textColor textColor-${colorValue}` ];
	const themeClass = S.Common.getThemeClass();
	const key = `marker-${id}-${type}`;

	if (active) {
		cn.push('active');
	};

	const props = {
		id: `marker-${id}`,
		className: ci.join(' '),
	};

	const onCheckboxEnterHandler = () => {
		if (!active && !readonly) {
			setHovered(true);
		};
	};

	const onCheckboxLeaveHandler = () => {
		if (!active && !readonly) {
			setHovered(false);
		};
	};

	const getToggle = () => {
		const c = J.Theme[themeClass]?.textColor[colorValue];

		const svg = `
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path fill-rule="evenodd" clip-rule="evenodd" d="M10.2158 7.2226C10.5087 6.92971 10.9835 6.92971 11.2764 7.2226L15.9507 11.8969C16.0093 11.9554 16.0093 12.0504 15.9507 12.109L11.2764 16.7833C10.9835 17.0762 10.5087 17.0762 10.2158 16.7833C9.92287 16.4904 9.92287 16.0155 10.2158 15.7226L13.9354 12.0029L10.2158 8.28326C9.92287 7.99037 9.92287 7.51549 10.2158 7.2226Z" fill="${c}"/>
			</svg>
		`;

		return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
	};

	let inner: any = null;

	switch (type) {
		case I.MarkerType.Bulleted: {
			inner = <span key={key} {...props} />;
			break;
		};

		case I.MarkerType.Numbered: {
			inner = <span key={key} {...props} />;
			break;
		};

		case I.MarkerType.Checkbox: {
			const idx = active ? 2 : (hovered ? 1 : 0);
			const SvgComponent = CheckboxIcons[idx];

			inner = SvgComponent ? (
				<SvgComponent
					onMouseEnter={onCheckboxEnterHandler}
					onMouseLeave={onCheckboxLeaveHandler}
				/>
			) : null;
			break;
		};

		case I.MarkerType.Toggle: {
			inner = <img src={getToggle()} onDragStart={e => e.preventDefault()} />;
			break;
		};
	};

	return (
		<div
			ref={refNode}
			className={cn.join(' ')}
			onClick={onClick}
			onMouseDown={onMouseDown}
		>
			{inner}
		</div>
	);
});

export default Marker;
