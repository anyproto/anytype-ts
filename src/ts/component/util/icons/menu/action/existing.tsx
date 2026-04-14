import React from 'react';

const Existing = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M10.75 4L16.75 10L10.75 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
		<rect width="13" height="1.5" transform="matrix(1 0 0 -1 3.75 10.75)" fill="currentColor"/>
	</svg>
);

export default Existing;
