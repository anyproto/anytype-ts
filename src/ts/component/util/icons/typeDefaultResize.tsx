import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function TypeDefaultResizeIcon({ size, color: _color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 512 512"><polyline points="304 96 416 96 416 208"/><line x1="405.77" y1="106.2" x2="111.98" y2="400.02"/><polyline points="208 416 96 416 96 304"/></svg>
	);
}
