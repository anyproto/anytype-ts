import React from 'react';

const Forward = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<rect y="28" width="28" height="28" rx="6" transform="rotate(-90 0 28)" fill="currentColor" fillOpacity="0.08"/>
		<path d="M7 14H21M21 14L16 9M21 14L16 19" stroke="currentColor" strokeWidth="1.5"/>
	</svg>
);

export default Forward;
