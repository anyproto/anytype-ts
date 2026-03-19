import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function MenuStyleCheckboxIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
			<circle cx="10" cy="10" r="8.25" stroke={color} strokeWidth="1.5"/>
			<path fillRule="evenodd" clipRule="evenodd" d="M14.5311 7.2794L8.02368 13.8094L4.97168 10.7825L6.02794 9.71747L8.01747 11.6906L13.4686 6.22058L14.5311 7.2794Z" fill={color}/>
		</svg>
	);
}
