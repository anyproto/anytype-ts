import React from 'react';

const ChevronUp = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M14.5 12L10 7.5L5.5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
	</svg>
);

export default ChevronUp;
