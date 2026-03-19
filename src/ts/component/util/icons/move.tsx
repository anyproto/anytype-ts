import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function MoveIcon({ size, color: _color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 512 512"><polyline points="176 112 256 32 336 112"/><line x1="255.98" y1="32" x2="256" y2="480"/><polyline points="176 400 256 480 336 400"/><polyline points="400 176 480 256 400 336"/><polyline points="112 176 32 256 112 336"/><line x1="32" y1="256" x2="480" y2="256"/></svg>
	);
}
