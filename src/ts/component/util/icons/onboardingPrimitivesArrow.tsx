import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function OnboardingPrimitivesArrowIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 36 36" fill="none">
    <rect width="36" height="36" rx="18" fill={color} fillOpacity="0.11"/>
    <path d="M19.5 13.5L15 18L19.5 22.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
</svg>
	);
}
