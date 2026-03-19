import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function PositionIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
<rect x="9.25" y="2" width="1.5" height="15" fill={color}/>
<path d="M7.5 4.5L10 2L12.5 4.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
<path d="M7.5 15.5L10 18L12.5 15.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
<rect x="2" y="10.75" width="1.5" height="15" transform="rotate(-90 2 10.75)" fill={color}/>
<path d="M4.5 12.5L2 10L4.5 7.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
<path d="M15.5 12.5L18 10L15.5 7.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
</svg>
	);
}
