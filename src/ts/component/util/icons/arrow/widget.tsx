import React from 'react';

const Arrow = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M14 8L10 12L6 8" stroke="currentColor" strokeLinecap="round"/>
	</svg>
);

export default Arrow;
