import React from 'react';

const Checkbox = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<g clipPath="url(#clip0_checkbox)">
			<path d="M13.2988 5.45993C13.5971 4.99539 14.216 4.86008 14.6806 5.15817C15.1451 5.45654 15.2804 6.07537 14.9824 6.54L9.84368 14.54C9.67227 14.8069 9.38382 14.9772 9.06731 14.998C8.75098 15.0187 8.44397 14.8875 8.23919 14.6455L5.09563 10.9316C4.73903 10.51 4.79224 9.87913 5.2138 9.52243C5.63541 9.16586 6.26629 9.21807 6.62298 9.63961L8.89153 12.3213L13.2988 5.45993Z" fill="currentColor"/>
		</g>
		<defs>
			<clipPath id="clip0_checkbox">
				<rect width="20" height="20" fill="white"/>
			</clipPath>
		</defs>
	</svg>
);

export default Checkbox;
