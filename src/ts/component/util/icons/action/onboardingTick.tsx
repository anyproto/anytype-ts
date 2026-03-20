import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function OnboardingTickIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 10 10" fill="none">
			<path d="M1 5L4.2 8.5L9 1.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
		</svg>
	);
}
