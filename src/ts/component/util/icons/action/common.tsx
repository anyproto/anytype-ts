import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function CommonIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 8 16" fill="none">
			<rect x="5" y="14" width="2" height="2" rx="1" transform="rotate(-180 5 14)" fill={color}/>
			<rect x="5" y="9" width="2" height="2" rx="1" transform="rotate(-180 5 9)" fill={color}/>
			<rect x="5" y="4" width="2" height="2" rx="1" transform="rotate(-180 5 4)" fill={color}/>
		</svg>
	);
}
