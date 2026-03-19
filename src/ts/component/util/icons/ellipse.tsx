import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function EllipseIcon({ size, color: _color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 512 512"><path d="M256,464C141.31,464,48,370.69,48,256S141.31,48,256,48s208,93.31,208,208S370.69,464,256,464Z"/></svg>
	);
}
