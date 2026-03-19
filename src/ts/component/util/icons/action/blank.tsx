import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function BlankIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
			<circle cx="10" cy="10" r="1.5" fill={color}/>
		</svg>
	);
}
