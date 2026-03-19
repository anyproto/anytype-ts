import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function DragIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 16 16" fill="none">
<path d="M13 11L16 8L13 5V11Z" fill={color}/>
<path d="M5 3L8 0L11 3H5Z" fill={color}/>
<path d="M5 13L8 16L11 13H5Z" fill={color}/>
<path d="M3 11L0 8L3 5L3 11Z" fill={color}/>
<rect x="2" y="7" width="12" height="2" fill={color}/>
<rect x="7" y="14" width="12" height="2" transform="rotate(-90 7 14)" fill={color}/>
</svg>
	);
}
