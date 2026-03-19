import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function MultiSelectIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
    <rect x="7.50391" y="9.37378" width="9" height="1.25" rx="0.625" fill={color}/>
    <rect x="3.5" y="8.74878" width="2.5" height="2.5" rx="1.25" fill={color}/>
    <rect x="7.50391" y="4.87378" width="9" height="1.25" rx="0.625" fill={color}/>
    <rect x="3.5" y="4.24878" width="2.5" height="2.5" rx="1.25" fill={color}/>
    <rect x="7.50391" y="13.8738" width="9" height="1.25" rx="0.625" fill={color}/>
    <rect x="3.5" y="13.2488" width="2.5" height="2.5" rx="1.25" fill={color}/>
</svg>
	);
}
