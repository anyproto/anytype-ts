import React from 'react';

const Close = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M5 5L10 10L5 15" stroke="currentColor" strokeLinecap="round" />
		<path d="M15 5L10 10L15 15" stroke="currentColor" strokeLinecap="round" />
	</svg>
);

export default Close;
