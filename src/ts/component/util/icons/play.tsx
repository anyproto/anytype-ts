import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function PlayIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 28" fill="none">
<path d="M0 28V0L24 14L0 28Z" fill={color}/>
</svg>
	);
}
