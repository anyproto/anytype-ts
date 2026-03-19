import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function GalleryIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
			<rect width="14" height="1.5" transform="matrix(0 -1 -1 0 5.75 17)" fill={color}/>
			<rect width="14" height="1.5" transform="matrix(0 -1 -1 0 10.75 17)" fill={color}/>
			<rect width="14" height="1.5" transform="matrix(-0.173648 -0.984808 -0.984808 0.173648 17.1277 16.7871)" fill={color}/>
		</svg>
	);
}
