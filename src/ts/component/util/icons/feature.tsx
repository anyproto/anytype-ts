import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function FeatureIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 22 21">
	<path fill={color} fillRule="nonzero" d="M11 16.842l-6.827 4.17 1.856-7.782-6.076-5.204 7.975-.64L11 0l3.072 7.387 7.975.639-6.076 5.204 1.856 7.782z"/>
</svg>
	);
}
