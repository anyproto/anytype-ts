import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function MenuSortArrowIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
			<path d="M10 4V16M10 16L5 11M10 16L15 11" stroke={color} strokeWidth="1.2"/>
		</svg>
	);
}
