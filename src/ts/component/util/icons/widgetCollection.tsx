import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function WidgetCollectionIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
<rect x="6" y="10" width="8" height="1" rx="0.5" fill={color}/>
<rect x="6" y="13" width="8" height="1" rx="0.5" fill={color}/>
<rect x="6" y="7" width="8" height="1" rx="0.5" fill={color}/>
</svg>
	);
}
