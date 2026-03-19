import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function SortArrowIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
			<rect x="9.5" y="5" width="1" height="10" fill={color}/>
			<path d="M6 11L10 15L14 11" stroke={color}/>
		</svg>
	);
}
