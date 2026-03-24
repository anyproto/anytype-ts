import React from 'react';

const Toggle = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M7 4L11 8L7 12" stroke="currentColor" strokeLinecap="round" />
	</svg>
);

export default Toggle;
