import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function BlockSearchIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 12 12" fill="none">
<g clipPath="url(#clip0_717_8970)">
<circle cx="5" cy="5" r="4.5" stroke="#929082"/>
<path d="M11.5 11.5L8.5 8.5" stroke="#929082" strokeLinecap="round"/>
</g>
<defs>
<clipPath id="clip0_717_8970">
<rect width="12" height="12" fill={color}/>
</clipPath>
</defs>
</svg>
	);
}
