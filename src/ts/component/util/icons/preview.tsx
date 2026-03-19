import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function PreviewIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 16 14" fill="none">
<circle cx="1.5" cy="7" r="1.5" fill={color}/>
<circle cx="1.5" cy="12" r="1.5" fill={color}/>
<circle cx="1.5" cy="2" r="1.5" fill={color}/>
<rect x="5" y="1.25" width="11" height="1.5" rx="0.75" fill={color}/>
<rect x="5" y="6.25" width="11" height="1.5" rx="0.75" fill={color}/>
<rect x="5" y="11.25" width="11" height="1.5" rx="0.75" fill={color}/>
</svg>
	);
}
