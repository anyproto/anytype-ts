import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function MenuStyleQuoteIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
<rect x="2" y="18" width="16" height="1" transform="rotate(-90 2 18)" fill={color}/>
<rect x="7" y="9.25" width="11" height="1.5" fill={color}/>
<rect x="7" y="4.25" width="11" height="1.5" fill={color}/>
<rect x="7" y="14.25" width="11" height="1.5" fill={color}/>
</svg>
	);
}
