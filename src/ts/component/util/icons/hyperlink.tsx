import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function HyperlinkIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 16 17" fill="none">
<path d="M5.5 3.75H13M13 3.75V11.25M13 3.75L3 13.75" stroke={color}/>
</svg>
	);
}
