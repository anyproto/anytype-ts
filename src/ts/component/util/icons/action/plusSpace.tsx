import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function PlusSpaceIcon({ size, color: _color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
			<g id="20 / Plus big" clipPath="url(#clip0_6386_18965)">
				<path id="Union" fillRule="evenodd" clipRule="evenodd" d="M10 0C10.4142 0 10.75 0.335786 10.75 0.75V9.25H19.25C19.6642 9.25 20 9.58579 20 10C20 10.4142 19.6642 10.75 19.25 10.75H10.75V19.25C10.75 19.6642 10.4142 20 10 20C9.58579 20 9.25 19.6642 9.25 19.25V10.75H0.75C0.335786 10.75 0 10.4142 0 10C0 9.58579 0.335786 9.25 0.75 9.25H9.25V0.75C9.25 0.335786 9.58579 0 10 0Z" fill="#fff"/>
			</g>
			<defs>
				<clipPath id="clip0_6386_18965">
					<rect width="20" height="20" fill="#fff"/>
				</clipPath>
			</defs>
		</svg>
	);
}
