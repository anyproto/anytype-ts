import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function SwapVerticalIcon({ size, color: _color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 512 512"><polyline points="464 208 352 96 240 208"/><line x1="352" y1="113.13" x2="352" y2="416"/><polyline points="48 304 160 416 272 304"/><line x1="160" y1="398" x2="160" y2="96"/></svg>
	);
}
