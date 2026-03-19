import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function ContractIcon({ size, color: _color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 512 512"><polyline points="304 416 304 304 416 304"/><line x1="314.2" y1="314.23" x2="432" y2="432"/><polyline points="208 96 208 208 96 208"/><line x1="197.8" y1="197.77" x2="80" y2="80"/><polyline points="416 208 304 208 304 96"/><line x1="314.23" y1="197.8" x2="432" y2="80"/><polyline points="96 304 208 304 208 416"/><line x1="197.77" y1="314.2" x2="80" y2="432"/></svg>
	);
}
