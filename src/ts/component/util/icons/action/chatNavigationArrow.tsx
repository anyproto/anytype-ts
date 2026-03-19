import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function ChatNavigationArrowIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
			<path d="M5.5 7.75L10 12.25L14.5 7.75" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
		</svg>
	);
}
