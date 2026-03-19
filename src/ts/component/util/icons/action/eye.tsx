import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function EyeIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
			<path d="M10 4C4.05 4 1 10 1 10C1 10 4 16 10 16C15.9688 16 19 10 19 10C19 10 15.95 4 10 4Z" fill={color}/>
			<circle cx="10" cy="10" r="3.5" stroke={color}/>
		</svg>
	);
}
