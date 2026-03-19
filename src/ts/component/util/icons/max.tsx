import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function MaxIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
<path d="M16.998 3V17H2.99805V3H16.998ZM4.49805 15.5H15.498V4.5H4.49805V15.5Z" fill={color}/>
</svg>
	);
}
