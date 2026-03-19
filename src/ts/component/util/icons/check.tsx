import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function CheckIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
<path d="M5 10L9 14.5L15 5.5" stroke={color} strokeWidth="1.2"/>
</svg>
	);
}
