import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function ShuffleIcon({ size, color: _color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 512 512"><polyline points="400 304 448 352 400 400"/><polyline points="400 112 448 160 400 208"/><path d="M64,352h85.19a80,80,0,0,0,66.56-35.62L256,256"/><path d="M64,160h85.19a80,80,0,0,1,66.56,35.62l80.5,120.76A80,80,0,0,0,362.81,352H416"/><path d="M416,160H362.81a80,80,0,0,0-66.56,35.62L288,208"/></svg>
	);
}
