import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function WindowArrowIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 12 12" fill="none">
			<path d="M3 4.5L6 7.5L9 4.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
		</svg>
	);
}
