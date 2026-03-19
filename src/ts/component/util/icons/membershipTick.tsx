import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function MembershipTickIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M3 7L6.2 10.5L11 3.5" stroke={color} strokeLinecap="round"/>
</svg>
	);
}
