import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function CenterIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
<rect x="5" y="7.25" width="10" height="1.5" rx="0.75" fill={color}/>
<rect x="5" y="15.25" width="10" height="1.5" rx="0.75" fill={color}/>
<rect x="2" y="3.25" width="16" height="1.5" rx="0.75" fill={color}/>
<rect x="2" y="11.25" width="16" height="1.5" rx="0.75" fill={color}/>
</svg>
	);
}
