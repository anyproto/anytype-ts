import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function FailedIcon({ size, color: _color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
			<path d="M7 7L10.5 10.5L7 14" stroke="#cb360d" strokeWidth="1.5" strokeLinecap="square"/>
			<path d="M14 7L10.5 10.5L14 14" stroke="#cb360d" strokeWidth="1.5" strokeLinecap="square"/>
		</svg>
	);
}
