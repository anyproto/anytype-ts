import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function PaymentTickIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 12 12" fill="none">
			<path d="M1 6L5 10L11 1" stroke={color} strokeWidth="1.5"/>
		</svg>
	);
}
