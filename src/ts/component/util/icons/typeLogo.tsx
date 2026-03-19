import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function TypeLogoIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 28 29" fill="none">
<rect y="0.9375" width="28" height="28" rx="6" fill="#EBEBEB" />
<path d="M11 23C13.7614 23 16 20.7614 16 18C16 15.2386 13.7614 13 11 13C8.23858 13 6 15.2386 6 18C6 20.7614 8.23858 23 11 23Z" fill={color}/>
<rect x="18" y="10" width="3" height="13" fill={color}/>
<path d="M18 7V10H8.5V7L18 7Z" fill={color}/>
</svg>
	);
}
