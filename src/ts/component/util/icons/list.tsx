import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function ListIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
<rect x="2" y="9.25" width="12" height="1.5" rx="0.75" fill={color}/>
<rect x="2" y="14.25" width="16" height="1.5" rx="0.75" fill={color}/>
<rect x="2" y="4.25" width="16" height="1.5" rx="0.75" fill={color}/>
</svg>
	);
}
