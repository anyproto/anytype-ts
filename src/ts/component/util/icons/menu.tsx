import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function MenuIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
<rect x="1" y="3.25" width="18" height="1.5" fill={color}/>
<rect x="1" y="9.25" width="18" height="1.5" fill={color}/>
<rect x="1" y="15.25" width="18" height="1.5" fill={color}/>
</svg>
	);
}
