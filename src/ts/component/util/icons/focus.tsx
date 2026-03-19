import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function FocusIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
<g clipPath="url(#clip0_4947_11499)">
<rect x="0.75" y="2.75" width="18.5" height="14.5" rx="1.75" stroke={color} strokeWidth="1.5"/>
</g>
<defs>
<clipPath id="clip0_4947_11499">
<rect width="20" height="20" fill={color}/>
</clipPath>
</defs>
</svg>
	);
}
