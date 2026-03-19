import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function SwapHorizontalIcon({ size, color: _color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 512 512"><polyline points="304 48 416 160 304 272"/><line x1="398.87" y1="160" x2="96" y2="160"/><polyline points="208 464 96 352 208 240"/><line x1="114" y1="352" x2="416" y2="352"/></svg>
	);
}
