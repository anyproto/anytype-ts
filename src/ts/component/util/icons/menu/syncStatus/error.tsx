import React from 'react';

const Error = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M7 7L10.5 10.5L7 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
		<path d="M14 7L10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
	</svg>
);

export default Error;
