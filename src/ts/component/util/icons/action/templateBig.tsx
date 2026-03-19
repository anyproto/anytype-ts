import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function TemplateBigIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 25" fill="none">
			<rect x="11.25" y="2.75" width="1.5" height="20" rx="0.75" fill={color}/>
			<rect x="22" y="12" width="1.5" height="20" rx="0.75" transform="rotate(90 22 12)" fill={color}/>
		</svg>
	);
}
