import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function CellIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 9 17" fill="none">
			<rect x="3.46875" y="2.81641" width="2" height="2" rx="1" fill={color}/>
			<rect x="3.46875" y="7.81641" width="2" height="2" rx="1" fill={color}/>
			<rect x="3.46875" y="12.8164" width="2" height="2" rx="1" fill={color}/>
		</svg>
	);
}
