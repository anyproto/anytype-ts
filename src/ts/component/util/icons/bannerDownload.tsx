import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function BannerDownloadIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 17 16" fill="none">
    <rect x="7.75" y="2" width="1.5" height="8" rx="0.75" fill={color}/>
    <path d="M12 7L9.15079 9.44218C8.7763 9.76317 8.2237 9.76317 7.84921 9.44218L5 7" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="3.5" y="12.5" width="10" height="1.5" rx="0.75" fill={color}/>
</svg>
	);
}
