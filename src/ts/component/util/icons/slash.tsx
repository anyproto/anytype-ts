import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function SlashIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
<rect x="2.75" y="2.75" width="14.5" height="14.5" rx="3.25" stroke={color} strokeWidth="1.5"/>
<rect x="11.6797" y="6.29297" width="1.5" height="8" rx="0.75" transform="rotate(35 11.6797 6.29297)" fill={color}/>
</svg>
	);
}
