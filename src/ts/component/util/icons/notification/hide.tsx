import React from 'react';

const Hide = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
	</svg>
);

export default Hide;
