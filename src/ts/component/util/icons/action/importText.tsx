import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function ImportTextIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 40 40" fill="none">
			<path d="M4 2C4 0.895431 4.89543 0 6 0H34C35.1046 0 36 0.895431 36 2V38C36 39.1046 35.1046 40 34 40H6C4.89543 40 4 39.1046 4 38V2Z" fill={color} fillOpacity="0.05"/>
			<path fillRule="evenodd" clipRule="evenodd" d="M28 13H12V15H28V13ZM28 17H12V19H28V17ZM12 21H28V23H12V21ZM24 25H12V27H24V25Z" fill="#2AA7EE"/>
		</svg>
	);
}
