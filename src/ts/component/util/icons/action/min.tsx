import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function MinIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
			<rect x="3" y="9.25" width="14" height="1.5" fill={color}/>
		</svg>
	);
}
