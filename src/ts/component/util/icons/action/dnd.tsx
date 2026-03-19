import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function DndIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
			<rect x="11" y="4" width="2" height="2" rx="1" fill={color}/>
			<rect x="11" y="9" width="2" height="2" rx="1" fill={color}/>
			<rect x="11" y="14" width="2" height="2" rx="1" fill={color}/>
			<rect x="6" y="4" width="2" height="2" rx="1" fill={color}/>
			<rect x="6" y="9" width="2" height="2" rx="1" fill={color}/>
			<rect x="6" y="14" width="2" height="2" rx="1" fill={color}/>
		</svg>
	);
}
