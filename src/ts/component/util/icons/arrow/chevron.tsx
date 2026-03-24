import React from 'react';

const Chevron = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M8 14.5L12.5 10L8 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
	</svg>
);

export default Chevron;
