import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function Style2Icon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 40 40" fill="none">
			<rect x="8" y="9.25" width="24" height="1.5" rx="0.75" fill={color}/>
			<rect x="8" y="29.25" width="24" height="1.5" rx="0.75" fill={color}/>
			<rect x="8.25" y="14.7812" width="6.5" height="10.5" rx="1.75" stroke={color} strokeWidth="0.5"/>
			<rect x="16.75" y="14.7812" width="6.5" height="10.5" rx="1.75" stroke={color} strokeWidth="0.5"/>
			<rect x="25.25" y="14.7812" width="6.5" height="10.5" rx="1.75" stroke={color} strokeWidth="0.5"/>
		</svg>
	);
}
