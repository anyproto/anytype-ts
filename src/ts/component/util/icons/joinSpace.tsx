import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function JoinSpaceIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
<circle cx="10" cy="10" r="8" fill={color}/>
<rect x="9.25" y="6" width="1.5" height="8" rx="0.75" fill={color}/>
<rect x="6" y="10.75" width="1.5" height="8" rx="0.75" transform="rotate(-90 6 10.75)" fill={color}/>
</svg>
	);
}
