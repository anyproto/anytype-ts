import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function ViewBoardIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
			<rect x="11.25" y="3.75" width="6" height="10" rx="1.25" stroke={color} strokeWidth="1.5"/>
			<rect x="2.75" y="3.75" width="6" height="12.5" rx="1.25" stroke={color} strokeWidth="1.5"/>
		</svg>
	);
}
