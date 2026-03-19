import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function ObjectPreviewToggleIcon({ size, color: _color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 16 16" fill="none">
			<path d="M7 4L11 8L7 12" stroke="#929082" strokeLinecap="round"/>
		</svg>
	);
}
