import React from 'react';

const ChevronDown = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M5.5 8L10 12.5L14.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
	</svg>
);

export default ChevronDown;
