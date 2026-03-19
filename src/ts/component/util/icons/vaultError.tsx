import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function VaultErrorIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 2 8" fill="none">
    <path d="M0 0H2L1.75 5H0.25L0 0Z" fill={color}/>
    <rect y="6" width="2" height="2" rx="1" fill={color}/>
</svg>
	);
}
