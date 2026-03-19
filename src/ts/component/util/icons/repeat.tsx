import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function RepeatIcon({ size, color: _color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 512 512"><polyline points="320 120 368 168 320 216"/><path d="M352,168H144a80.24,80.24,0,0,0-80,80v16"/><polyline points="192 392 144 344 192 296"/><path d="M160,344H368a80.24,80.24,0,0,0,80-80V248"/></svg>
	);
}
