import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function ViewCalendar0Icon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 56 56" fill="none">
			<rect x="10.5625" y="13" width="34" height="30" rx="3" fill="url(#paint0_linear_7593_14830)"/>
			<rect x="11.0625" y="13.5" width="33" height="29" rx="2.5" stroke={color}/>
			<rect x="10.5625" y="21" width="34" height="1" fill={color}/>
			<rect x="25" y="25.5" width="5" height="3" rx="0.5" stroke={color}/>
			<rect x="33" y="25.5" width="5" height="3" rx="0.5" stroke={color}/>
			<rect x="17" y="30.5" width="5" height="3" rx="0.5" stroke={color}/>
			<rect x="25" y="35.5" width="5" height="3" rx="0.5" stroke={color}/>
			<rect x="33" y="30.5" width="5" height="3" rx="0.5" stroke={color}/>
			<rect x="17" y="35.5" width="5" height="3" rx="0.5" stroke={color}/>
			<rect x="25" y="30.5" width="5" height="3" rx="0.5" stroke={color}/>
			<defs>
				<linearGradient id="paint0_linear_7593_14830" x1="10.5625" y1="14.5" x2="45.2071" y2="31.9283" gradientUnits="userSpaceOnUse">
					<stop stopColor="#E9E9E9"/>
					<stop offset="1" stopColor="#F2F2F2" stopOpacity="0"/>
				</linearGradient>
			</defs>
		</svg>
	);
}
