import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function ViewGridIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
			<path d="M3 7H17V8.5H3V7Z" fill={color}/>
			<path d="M3 11.5H17V13H3V11.5Z" fill={color}/>
			<path d="M6.5 4H8V16H6.5V4Z" fill={color}/>
			<rect x="2.75" y="3.75" width="14.5" height="12.5039" rx="1.25" stroke={color} strokeWidth="1.5"/>
		</svg>
	);
}
