import React from 'react';

const Lock = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<rect x="2.5" y="7" width="11" height="7" rx="1" fill="currentColor"/>
		<path d="M5.25 4.5C5.25 2.98122 6.48122 1.75 8 1.75C9.51878 1.75 10.75 2.98122 10.75 4.5V9.25H5.25V4.5Z" stroke="currentColor" strokeWidth="1.5"/>
	</svg>
);

export default Lock;
