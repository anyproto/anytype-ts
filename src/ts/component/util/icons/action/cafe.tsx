import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function CafeIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 18 16" fill="none">
			<rect width="18" height="7" rx="3.5" fill={color}/>
			<rect y="9" width="18" height="7" rx="3.5" fill={color}/>
			<rect x="2" y="11" width="3" height="3" rx="1.5" fill={color}/>
			<rect x="2" y="2" width="3" height="3" rx="1.5" fill={color}/>
		</svg>
	);
}
