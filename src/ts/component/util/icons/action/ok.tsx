import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function OkIcon({ size, color: _color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
			<path d="M5 10L9 14L15 6" stroke="#377AFF" strokeWidth="1.5"/>
		</svg>
	);
}
