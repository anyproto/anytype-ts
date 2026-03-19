import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function QrIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 21 21" fill="none">
<rect x="3.25" y="2.92383" width="5.5" height="5.5" rx="1.25" stroke={color} strokeWidth="1.5"/>
<rect x="3.25" y="11.9238" width="5.5" height="5.5" rx="1.25" stroke={color} strokeWidth="1.5"/>
<rect x="12.25" y="2.92383" width="5.5" height="5.5" rx="1.25" stroke={color} strokeWidth="1.5"/>
<rect x="5" y="4.67383" width="2" height="2" rx="0.5" fill={color}/>
<rect x="5" y="13.6738" width="2" height="2" rx="0.5" fill={color}/>
<rect x="14" y="4.67383" width="2" height="2" rx="0.5" fill={color}/>
<rect x="14" y="13.6738" width="2" height="2" rx="0.5" fill={color}/>
<rect x="11.5" y="11.1738" width="2" height="2" rx="0.5" fill={color}/>
<rect x="11.5" y="16.1738" width="2" height="2" rx="0.5" fill={color}/>
<rect x="16.5" y="11.1738" width="2" height="2" rx="0.5" fill={color}/>
<rect x="16.5" y="16.1738" width="2" height="2" rx="0.5" fill={color}/>
</svg>
	);
}
