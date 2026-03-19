import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function WidgetRemoveIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
			<path d="M14 10H6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
		</svg>
	);
}
