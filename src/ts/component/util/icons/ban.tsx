import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function BanIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 512 512"><circle fill="none" stroke={color} strokeMiterlimit="10" strokeWidth="48" cx="256" cy="256" r="200"/><line stroke={color} strokeMiterlimit="10" strokeWidth="48" x1="114.58" y1="114.58" x2="397.42" y2="397.42"/></svg>
	);
}
