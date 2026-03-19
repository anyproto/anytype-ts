import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function TablePlusIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 11 10" fill="none">
			<rect x="4.71875" width="1.5" height="10" rx="0.75" fill={color}/>
			<rect x="10.4688" y="4.25" width="1.5" height="10" rx="0.75" transform="rotate(90 10.4688 4.25)" fill={color}/>
		</svg>
	);
}
