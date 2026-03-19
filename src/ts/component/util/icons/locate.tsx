import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function LocateIcon({ size, color: _color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 512 512"><line x1="256" y1="96" x2="256" y2="56"/><line x1="256" y1="456" x2="256" y2="416"/><path d="M256,112A144,144,0,1,0,400,256,144,144,0,0,0,256,112Z"/><line x1="416" y1="256" x2="456" y2="256"/><line x1="56" y1="256" x2="96" y2="256"/></svg>
	);
}
