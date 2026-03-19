import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function DotsIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none">
<path d="M6 14.0322C7.10457 14.0322 8 13.1368 8 12.0322C8 10.9277 7.10457 10.0322 6 10.0322C4.89543 10.0322 4 10.9277 4 12.0322C4 13.1368 4.89543 14.0322 6 14.0322Z" fill={color}/>
<path d="M12 14.0322C13.1046 14.0322 14 13.1368 14 12.0322C14 10.9277 13.1046 10.0322 12 10.0322C10.8954 10.0322 10 10.9277 10 12.0322C10 13.1368 10.8954 14.0322 12 14.0322Z" fill={color}/>
<path d="M18 14.0322C19.1046 14.0322 20 13.1368 20 12.0322C20 10.9277 19.1046 10.0322 18 10.0322C16.8954 10.0322 16 10.9277 16 12.0322C16 13.1368 16.8954 14.0322 18 14.0322Z" fill={color}/>
</svg>
	);
}
