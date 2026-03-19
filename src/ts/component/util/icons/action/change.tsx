import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function ChangeIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
			<path d="M13 8.5C13.8284 8.5 14.5 7.82843 14.5 7C14.5 6.17157 13.8284 5.5 13 5.5C12.1716 5.5 11.5 6.17157 11.5 7C11.5 7.82843 12.1716 8.5 13 8.5Z" fill={color}/>
			<rect x="2.75" y="2.75" width="14.5" height="14.5" rx="2.75" stroke={color} strokeWidth="1.5"/>
			<path d="M3 15L8 10L11 13L13 11L17 15" stroke={color} strokeWidth="1.5"/>
		</svg>
	);
}
