import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function MenuStyleTextIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
			<rect x="9.25" y="3" width="1.5" height="14" fill={color}/>
			<rect x="4.5" y="4.5" width="1.5" height="11" transform="rotate(-90 4.5 4.5)" fill={color}/>
		</svg>
	);
}
