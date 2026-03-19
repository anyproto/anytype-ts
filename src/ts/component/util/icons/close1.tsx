import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function Close1Icon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 16 16" fill="none">
<path d="M3 3L8 8L3 13" stroke={color} strokeLinecap="round"/>
<path d="M13 3L8 8L13 13" stroke={color} strokeLinecap="round"/>
</svg>
	);
}
