import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function MenuCheckbox1Icon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 18 18" fill="none">
			<rect x="1" y="1" width="16" height="16" rx="4" fill={color}/>
			<path fillRule="evenodd" clipRule="evenodd" d="M13.6094 5.43631L8.09478 13.1567L4.46875 9.53071L5.52941 8.47005L7.90338 10.844L12.3888 4.56445L13.6094 5.43631Z" fill={color}/>
		</svg>
	);
}
