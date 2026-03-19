import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function MicIcon({ size, color: _color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 512 512"><line x1="192" y1="448" x2="320" y2="448"/><path d="M384,208v32c0,70.4-57.6,128-128,128h0c-70.4,0-128-57.6-128-128V208"/><line x1="256" y1="368" x2="256" y2="448"/><path d="M256,320a78.83,78.83,0,0,1-56.55-24.1A80.89,80.89,0,0,1,176,239V128a79.69,79.69,0,0,1,80-80c44.86,0,80,35.14,80,80V239C336,283.66,300.11,320,256,320Z"/></svg>
	);
}
