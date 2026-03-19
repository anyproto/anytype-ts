import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function HlIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 16 16" fill="none">
<rect x="6.875" y="3" width="2" height="10" fill={color}/>
</svg>
	);
}
