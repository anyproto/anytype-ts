import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function QueuedIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
<rect x="9" y="2" width="1.5" height="5" rx="0.75" fill={color}/>
<rect x="14.9492" y="3.63605" width="1.5" height="5" rx="0.75" transform="rotate(45 14.9492 3.63605)" fill={color}/>
<rect x="18" y="9" width="1.5" height="5" rx="0.75" transform="rotate(90 18 9)" fill={color}/>
<rect x="16.3633" y="14.9498" width="1.5" height="5" rx="0.75" transform="rotate(135 16.3633 14.9498)" fill={color}/>
<rect x="11" y="18" width="1.5" height="5" rx="0.75" transform="rotate(180 11 18)" fill={color}/>
<rect x="5.05078" y="16.364" width="1.5" height="5" rx="0.75" transform="rotate(-135 5.05078 16.364)" fill={color}/>
<rect x="2" y="11" width="1.5" height="5" rx="0.75" transform="rotate(-90 2 11)" fill={color}/>
<rect x="3.63672" y="5.05023" width="1.5" height="5" rx="0.75" transform="rotate(-45 3.63672 5.05023)" fill={color}/>
</svg>
	);
}
