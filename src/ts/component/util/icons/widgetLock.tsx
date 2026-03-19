import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function WidgetLockIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 16 16" fill="none">
<rect x="2.5" y="7" width="11" height="7" rx="1" fill={color}/>
<path d="M5.25 4.5C5.25 2.98122 6.48122 1.75 8 1.75C9.51878 1.75 10.75 2.98122 10.75 4.5V9.25H5.25V4.5Z" stroke={color} strokeWidth="1.5"/>
</svg>
	);
}
