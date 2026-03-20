import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function Check0Icon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 16 16" fill="none">
			<circle cx="8" cy="8" r="4.5" stroke={color}/>
		</svg>
	);
}
