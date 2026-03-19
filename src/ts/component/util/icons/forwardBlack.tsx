import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function ForwardBlackIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 9 14" fill="none">
    <path d="M1 1L7 7L1 13" stroke={color} strokeWidth="1.5"/>
</svg>
	);
}
