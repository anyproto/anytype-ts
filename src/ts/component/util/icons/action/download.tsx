import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function DownloadIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 28 28" fill="none">
			<rect opacity="0.35" width="28" height="28" rx="4" fill={color}/>
			<rect x="21.25" y="6.75" width="14.5" height="14.5" rx="1.25" transform="rotate(90 21.25 6.75)" stroke={color} strokeWidth="1.5"/>
			<path d="M17.5 14L14 17.5L10.5 14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
			<rect x="-0.375" y="-0.375" width="6.25" height="0.75" transform="matrix(0 -1 -1 0 14 15.75)" fill={color} stroke={color} strokeWidth="0.75"/>
		</svg>
	);
}
