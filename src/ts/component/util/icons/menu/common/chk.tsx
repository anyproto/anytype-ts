import React from 'react';

const Chk = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M5 10L9 14.5L15 5.5" stroke="currentColor" strokeWidth="1.2"/>
	</svg>
);

export default Chk;
