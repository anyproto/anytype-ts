import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function DataviewDndIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 7 12" fill="none">
<rect x="5" width="2" height="2" rx="1" fill={color}/>
<rect x="5" y="5" width="2" height="2" rx="1" fill={color}/>
<rect x="5" y="10" width="2" height="2" rx="1" fill={color}/>
<rect width="2" height="2" rx="1" fill={color}/>
<rect y="5" width="2" height="2" rx="1" fill={color}/>
<rect y="10" width="2" height="2" rx="1" fill={color}/>
</svg>
	);
}
