import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function OnboardingCopyIcon({ size, color: _color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
			<rect x="14" y="14" width="12" height="12" rx="3" transform="rotate(180 14 14)" fill="#737373"/>
			<path fillRule="evenodd" clipRule="evenodd" d="M14.9995 18C16.6564 18 17.9995 16.6569 17.9995 15V9C17.9995 7.5135 16.9184 6.27952 15.4995 6.04148V11C15.4995 13.4853 13.4848 15.5 10.9995 15.5H6.04102C6.27905 16.9189 7.51304 18 8.99954 18H14.9995Z" fill="#737373"/>
		</svg>
	);
}
