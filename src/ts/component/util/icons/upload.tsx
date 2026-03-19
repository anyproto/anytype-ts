import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function UploadIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none">
<path d="M11 3C11 2.44772 11.4477 2 12 2C12.5523 2 13 2.44772 13 3V18H11V3Z" fill={color}/>
<path fillRule="evenodd" clipRule="evenodd" d="M12 1.58594L19.7071 9.29304C20.0976 9.68357 20.0976 10.3167 19.7071 10.7073C19.3166 11.0978 18.6834 11.0978 18.2929 10.7073L12 4.41436L5.70711 10.7073C5.31658 11.0978 4.68342 11.0978 4.29289 10.7073C3.90237 10.3167 3.90237 9.68357 4.29289 9.29304L12 1.58594Z" fill={color}/>
<rect x="4" y="20" width="16" height="2.07031" fill={color}/>
</svg>
	);
}
