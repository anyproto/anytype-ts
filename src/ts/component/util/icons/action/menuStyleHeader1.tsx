import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function MenuStyleHeader1Icon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
			<rect x="2.7998" y="9.19995" width="8" height="1.36" fill={color}/>
			<rect x="2" y="3" width="1.5" height="14" fill={color}/>
			<rect x="10" y="3" width="1.5" height="14" fill={color}/>
			<path d="M19 9H17.6211L15.6328 10.2773V11.6055L17.5039 10.4102H17.5508V17H19V9Z" fill={color}/>
		</svg>
	);
}
