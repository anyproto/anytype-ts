import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function LongTextIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
    <rect x="3.5" y="9.37305" width="13" height="1.25" rx="0.625" fill={color}/>
    <rect x="3.5" y="4.87305" width="13" height="1.25" rx="0.625" fill={color}/>
    <rect x="3.5" y="13.873" width="7" height="1.25" rx="0.625" fill={color}/>
</svg>
	);
}
