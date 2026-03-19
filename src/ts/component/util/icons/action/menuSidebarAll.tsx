import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function MenuSidebarAllIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
			<g clipPath="url(#clip0_4947_11492)">
				<rect x="0.75" y="2.75" width="18.5" height="14.5" rx="1.75" stroke={color} strokeWidth="1.5"/>
				<path d="M3.5 17L3.5 3H5L5 17H3.5Z" fill={color}/>
				<rect x="9.5" y="17.5" width="15" height="1.5" transform="rotate(-90 9.5 17.5)" fill={color}/>
			</g>
			<defs>
				<clipPath id="clip0_4947_11492">
					<rect width="20" height="20" fill={color}/>
				</clipPath>
			</defs>
		</svg>
	);
}
