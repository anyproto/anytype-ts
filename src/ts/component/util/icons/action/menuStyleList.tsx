import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function MenuStyleListIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
			<rect x="7" y="4.25" width="11" height="1.5" fill={color}/>
			<rect x="7" y="9.25" width="8" height="1.5" fill={color}/>
			<rect x="7" y="14.25" width="11" height="1.5" fill={color}/>
			<circle cx="3.5" cy="5" r="1.5" fill={color}/>
			<circle cx="3.5" cy="15" r="1.5" fill={color}/>
		</svg>
	);
}
