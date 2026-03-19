import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function SpacesIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
			<circle cx="10" cy="10" r="4" fill={color}/>
			<circle cx="10.1477" cy="3.1164" r="1.14765" fill={color}/>
			<circle cx="10.1477" cy="16.8522" r="1.14765" fill={color}/>
			<circle cx="3.14765" cy="9.98419" r="1.14765" transform="rotate(-90 3.14765 9.98419)" fill={color}/>
			<circle cx="16.8836" cy="9.98419" r="1.14765" transform="rotate(-90 16.8836 9.98419)" fill={color}/>
			<circle cx="5.62302" cy="5.12988" r="1.14765" transform="rotate(-45 5.62302 5.12988)" fill={color}/>
			<circle cx="15.3377" cy="14.8447" r="1.14765" transform="rotate(-45 15.3377 14.8447)" fill={color}/>
			<circle cx="15" cy="5.12986" r="1.14765" transform="rotate(45 15 5.12986)" fill={color}/>
			<circle cx="5.28528" cy="14.8447" r="1.14765" transform="rotate(45 5.28528 14.8447)" fill={color}/>
		</svg>
	);
}
