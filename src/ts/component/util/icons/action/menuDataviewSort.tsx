import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function MenuDataviewSortIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
			<path fillRule="evenodd" clipRule="evenodd" d="M9.21093 4.23729C9.70189 3.83693 10.4262 3.86564 10.8838 4.32323L15.0303 8.46971C15.323 8.76259 15.323 9.23741 15.0303 9.53026C14.7374 9.8231 14.2626 9.823 13.9697 9.53026L10.749 6.30955V15.75C10.749 16.1642 10.4132 16.5 9.99902 16.5C9.58503 16.4997 9.24905 16.164 9.24902 15.75V6.31151L6.03027 9.53026C5.73743 9.8231 5.26263 9.823 4.96972 9.53026C4.67683 9.23736 4.67683 8.7626 4.96972 8.46971L9.11621 4.32323L9.21093 4.23729Z" fill={color}/>
		</svg>
	);
}
