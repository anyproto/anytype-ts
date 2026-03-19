import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function NotificationDeleteIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 10 10" fill="none">
			<path d="M1 1L5 5L1 9" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
			<path d="M9 1L5 5L9 9" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
		</svg>
	);
}
