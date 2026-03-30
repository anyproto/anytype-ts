import React from 'react';

const Tick = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M3 7L6.2 10.5L11 3.5" stroke="currentColor" strokeLinecap="round" />
	</svg>
);

export default Tick;
