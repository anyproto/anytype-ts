import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function WidgetSection0Icon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 12 12" fill="none">
			<rect x="5.25" y="1" width="1.5" height="10" rx="0.75" fill={color}/>
			<rect x="1" y="6.75" width="1.5" height="10" rx="0.75" transform="rotate(-90 1 6.75)" fill={color}/>
		</svg>
	);
}
