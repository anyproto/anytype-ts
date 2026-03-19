import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function Resize0Icon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
<rect x="2" y="9.25" width="7" height="1.5" fill={color}/>
<rect x="11" y="9.25" width="7" height="1.5" fill={color}/>
<path d="M5.25 6L1.25 10L5.25 14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
<path d="M14.75 6L18.75 10L14.75 14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
</svg>
	);
}
