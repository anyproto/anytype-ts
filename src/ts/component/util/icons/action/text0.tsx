import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function Text0Icon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
			<rect x="3" y="4.25" width="14" height="1.49828" fill={color}/>
			<rect x="3" y="14.25" width="10" height="1.49828" fill={color}/>
			<rect x="3" y="9.25" width="14" height="1.49828" fill={color}/>
		</svg>
	);
}
