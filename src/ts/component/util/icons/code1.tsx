import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function Code1Icon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
<g clipPath="url(#clip0)">
<path d="M8 5L3 10L8 15" stroke={color} strokeWidth="1.5"/>
<path d="M12 5L17 10L12 15" stroke={color} strokeWidth="1.5"/>
</g>
<defs>
<clipPath id="clip0">
<rect x="2" y="2" width="16" height="16" fill={color}/>
</clipPath>
</defs>
</svg>
	);
}
