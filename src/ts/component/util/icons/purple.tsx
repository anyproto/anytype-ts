import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function PurpleIcon({ size, color: _color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 64 64" fill="none">
<circle opacity="0.5" cx="32" cy="32" r="32" fill="url(#paint0_radial_1816_25191)"/>
<circle opacity="0.65" cx="32" cy="40" r="22" fill="url(#paint1_radial_1816_25191)"/>
<circle opacity="0.8" cx="32" cy="48" r="12" fill="url(#paint2_radial_1816_25191)"/>
<defs>
<radialGradient id="paint0_radial_1816_25191" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(32 32) rotate(90) scale(32)">
<stop offset="0.41" stopColor="#E86DE3" stopOpacity="0"/>
<stop offset="1" stopColor="#E86DE3"/>
</radialGradient>
<radialGradient id="paint1_radial_1816_25191" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(32 40) rotate(90) scale(22)">
<stop offset="0.41" stopColor="#E86DE3" stopOpacity="0"/>
<stop offset="1" stopColor="#E86DE3"/>
</radialGradient>
<radialGradient id="paint2_radial_1816_25191" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(32 48) rotate(90) scale(12)">
<stop offset="0.41" stopColor="#E86DE3" stopOpacity="0"/>
<stop offset="1" stopColor="#E86DE3"/>
</radialGradient>
</defs>
</svg>
	);
}
