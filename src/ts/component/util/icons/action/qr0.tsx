import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function Qr0Icon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
			<rect x="2.75" y="2.75" width="5.5" height="5.5" rx="1.25" stroke={color} strokeWidth="1.5"/>
			<rect x="2.75" y="11.75" width="5.5" height="5.5" rx="1.25" stroke={color} strokeWidth="1.5"/>
			<rect x="11.75" y="2.75" width="5.5" height="5.5" rx="1.25" stroke={color} strokeWidth="1.5"/>
			<rect x="4.5" y="4.5" width="2" height="2" rx="0.5" fill={color}/>
			<rect x="4.5" y="13.5" width="2" height="2" rx="0.5" fill={color}/>
			<rect x="13.5" y="4.5" width="2" height="2" rx="0.5" fill={color}/>
			<rect x="13.5" y="13.5" width="2" height="2" rx="0.5" fill={color}/>
			<rect x="11" y="11" width="2" height="2" rx="0.5" fill={color}/>
			<rect x="11" y="16" width="2" height="2" rx="0.5" fill={color}/>
			<rect x="16" y="11" width="2" height="2" rx="0.5" fill={color}/>
			<rect x="16" y="16" width="2" height="2" rx="0.5" fill={color}/>
		</svg>
	);
}
