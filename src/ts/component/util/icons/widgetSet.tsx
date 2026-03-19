import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function WidgetSetIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
<circle cx="6.5" cy="6.5" r="1.5" fill={color}/>
<circle cx="13.5" cy="6.5" r="1.5" fill={color}/>
<circle cx="6.5" cy="13.5" r="1.5" fill={color}/>
<circle cx="13.5" cy="13.5" r="1.5" fill={color}/>
</svg>
	);
}
