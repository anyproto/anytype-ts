import React from 'react';

const Resize = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<rect x="2" y="9.25" width="7" height="1.5" fill="currentColor"/>
		<rect x="11" y="9.25" width="7" height="1.5" fill="currentColor"/>
		<path d="M5.25 6L1.25 10L5.25 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
		<path d="M14.75 6L18.75 10L14.75 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
	</svg>
);

export default Resize;
