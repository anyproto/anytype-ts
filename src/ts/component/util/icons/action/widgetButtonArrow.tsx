import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function WidgetButtonArrowIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
			<path d="M14 8L10 12L6 8" stroke={color} strokeLinecap="round"/>
		</svg>
	);
}
