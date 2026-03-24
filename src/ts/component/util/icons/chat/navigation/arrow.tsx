import React from 'react';

const Arrow = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M5.5 7.75L10 12.25L14.5 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
	</svg>
);

export default Arrow;
