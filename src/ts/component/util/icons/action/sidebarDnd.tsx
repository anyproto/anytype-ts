import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function SidebarDndIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 21" fill="none">
			<rect x="11" y="4.98584" width="2" height="2" rx="1" fill={color}/>
			<rect x="11" y="9.98584" width="2" height="2" rx="1" fill={color}/>
			<rect x="11" y="14.9858" width="2" height="2" rx="1" fill={color}/>
			<rect x="6" y="4.98584" width="2" height="2" rx="1" fill={color}/>
			<rect x="6" y="9.98584" width="2" height="2" rx="1" fill={color}/>
			<rect x="6" y="14.9858" width="2" height="2" rx="1" fill={color}/>
		</svg>
	);
}
