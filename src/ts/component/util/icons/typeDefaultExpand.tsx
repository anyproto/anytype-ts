import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function TypeDefaultExpandIcon({ size, color: _color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 512 512"><polyline points="432 320 432 432 320 432"/><line x1="421.8" y1="421.77" x2="304" y2="304"/><polyline points="80 192 80 80 192 80"/><line x1="90.2" y1="90.23" x2="208" y2="208"/><polyline points="320 80 432 80 432 192"/><line x1="421.77" y1="90.2" x2="304" y2="208"/><polyline points="192 432 80 432 80 320"/><line x1="90.23" y1="421.8" x2="208" y2="304"/></svg>
	);
}
