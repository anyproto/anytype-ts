import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function BannerCloseIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
    <rect x="6" y="9.25" width="8" height="1.5" rx="0.75" fill={color}/>
</svg>
	);
}
