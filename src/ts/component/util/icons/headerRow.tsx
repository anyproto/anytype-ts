import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function HeaderRowIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
<path d="M5 4C3.89543 4 3 4.89543 3 6L3 8L17 8L17 6C17 4.89543 16.1046 4 15 4L5 4Z" fill={color}/>
<rect x="0.75" y="-0.75" width="14.5" height="12.5" rx="1.25" transform="matrix(1 8.74228e-08 8.74228e-08 -1 2 15.5)" stroke={color} strokeWidth="1.5"/>
<rect x="3" y="7" width="14" height="1.5" fill={color}/>
</svg>
	);
}
