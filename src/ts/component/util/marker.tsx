import React, { forwardRef, useRef } from 'react';
import $ from 'jquery';
import { I, S, J } from 'Lib';
import { observer } from 'mobx-react';

interface Props {
	id: string;
	type: I.MarkerType;
	color: string;
	className?: string;
	readonly?: boolean;
	active: boolean;
	onClick?(): void;
};

const Icons: any = {};
const Theme: any = { dark: {} };

Icons[I.MarkerType.Checkbox] = {
	0:		 require('img/icon/marker/checkbox0.svg'),
	1:		 require('img/icon/marker/checkbox1.svg'),
	2:		 require('img/icon/marker/checkbox2.svg'),
};

Theme.dark[I.MarkerType.Checkbox] = {
	0:		 require('img/icon/marker/checkbox0.svg'),
	1:		 require('img/theme/dark/icon/marker/checkbox1.svg'),
	2:		 require('img/icon/marker/checkbox2.svg'),
};

const Marker = observer(forwardRef<HTMLDivElement, Props>(({ 
	id = '', 
	type = I.MarkerType.Bulleted,
	color = 'default', 
	className = '', 
	active = false, 
	readonly = false,
	onClick,
}, ref) => {

	const colorValue = color || 'default';
	const refNode = useRef<HTMLDivElement>(null);
	const cn = [ 'marker', className ];
	const ci = [ 'markerInner', `c${type}`, `textColor textColor-${colorValue}` ];
	const themeClass = S.Common.getThemeClass();

	if (active) {
		cn.push('active');
	};
	
	const props = {
		id: `marker-${id}`,
		key: `marker-${id}-${type}`,
		className: ci.join(' '),
	};

	const onCheckboxEnterHandler = () => {
		if (!active && !readonly) {
			$(refNode.current).find('img').attr({ src: getIcon(type)[1] });
		};
	};

	const onCheckboxLeaveHandler = () => {
		if (!active && !readonly) {
			$(refNode.current).find('img').attr({ src: getIcon(type)[0] });
		};
	};

	const getIcon = (type: I.MarkerType) => {
		const item = Theme[themeClass];
		return (item && item[type]) ? item[type] : Icons[type];
	};

	const getToggle = () => {
		const c = J.Theme[themeClass]?.color[colorValue];

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
			inner = <span {...props} />;
			break;
		};
			
		case I.MarkerType.Numbered: {
			inner = <span {...props} />;
			break;
		};
			
		case I.MarkerType.Checkbox: {
			inner = (
				<img 
					src={getIcon(type)[active ? 2 : 0]} 
					onDragStart={e => e.preventDefault()} 
					onMouseEnter={onCheckboxEnterHandler} 
					onMouseLeave={onCheckboxLeaveHandler} 
				/>
			);
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
		>
			{inner}
		</div>
	);
}));

export default Marker;