import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function SelectionCheckbox1Icon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
			<path d="M0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10C20 15.5228 15.5228 20 10 20C4.47715 20 0 15.5228 0 10Z" fill="#fe9a00"/>
			<path d="M6 9.5L9.5 13.5L14.5 5.5" stroke={color} strokeWidth="1.5"/>
		</svg>
	);
}
