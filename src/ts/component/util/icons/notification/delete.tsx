import React from 'react';

const Delete = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M1 1L5 5L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
		<path d="M9 1L5 5L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
	</svg>
);

export default Delete;
