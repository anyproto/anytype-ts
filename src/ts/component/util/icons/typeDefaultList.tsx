import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function TypeDefaultListIcon({ size, color: _color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 512 512"><line x1="160" y1="144" x2="448" y2="144"/><line x1="160" y1="256" x2="448" y2="256"/><line x1="160" y1="368" x2="448" y2="368"/><circle cx="80" cy="144" r="16"/><circle cx="80" cy="256" r="16"/><circle cx="80" cy="368" r="16"/></svg>
	);
}
