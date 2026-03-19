import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function GalleryIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 21" fill="none">
<rect x="11.25" y="3.79688" width="6" height="5" rx="1.25" stroke={color} strokeWidth="1.5"/>
<rect x="11.25" y="11.25" width="6" height="5" rx="1.25" stroke={color} strokeWidth="1.5"/>
<rect x="2.75" y="3.79688" width="6" height="5" rx="1.25" stroke={color} strokeWidth="1.5"/>
<rect x="2.75" y="11.25" width="6" height="5" rx="1.25" stroke={color} strokeWidth="1.5"/>
</svg>
	);
}
