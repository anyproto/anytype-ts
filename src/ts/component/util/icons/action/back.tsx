import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function BackIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
			<path d="M12 4L6 10L12 16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
		</svg>
	);
}
