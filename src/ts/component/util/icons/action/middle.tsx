import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function MiddleIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 21" fill="none">
			<rect x="2" y="9.92188" width="16" height="1.5" rx="0.75" fill={color}/>
			<rect x="7" y="4.46094" width="6" height="12" rx="1" stroke={color} strokeWidth="1.5"/>
		</svg>
	);
}
