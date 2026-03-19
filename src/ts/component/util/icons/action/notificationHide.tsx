import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function NotificationHideIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 12 8" fill="none">
			<path d="M1 1.5L6 6.5L11 1.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
		</svg>
	);
}
