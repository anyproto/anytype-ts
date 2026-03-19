import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function UploadComputerIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
<path d="M0.5 16.75C0.5 16.3358 0.835786 16 1.25 16H18.75C19.1642 16 19.5 16.3358 19.5 16.75C19.5 17.1642 19.1642 17.5 18.75 17.5H1.25C0.835786 17.5 0.5 17.1642 0.5 16.75Z" fill={color}/>
<path d="M4 4.75H16C16.4142 4.75 16.75 5.08579 16.75 5.5V13.5C16.75 13.9142 16.4142 14.25 16 14.25H4C3.58579 14.25 3.25 13.9142 3.25 13.5V5.5C3.25 5.08579 3.58579 4.75 4 4.75Z" stroke={color} strokeWidth="1.5"/>
</svg>
	);
}
