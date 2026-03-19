import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function ColorNoneIcon({ size, color: _color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 7 7" fill="none">
    <path d="M0.5 6.5L6.5 0.5" stroke="#BFBFBF" strokeLinecap="round"/>
</svg>
	);
}
