import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function Style1Icon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
<rect x="2" y="3.25" width="16" height="1.5" rx="0.75" fill={color}/>
<rect x="2" y="15.25" width="16" height="1.5" rx="0.75" fill={color}/>
<rect x="2.25" y="6.75" width="15.5" height="6.5" rx="1.75" stroke={color} strokeWidth="0.5"/>
</svg>
	);
}
