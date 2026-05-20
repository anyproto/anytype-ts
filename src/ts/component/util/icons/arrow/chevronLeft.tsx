import React from 'react';

const ChevronLeft = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M12.25 5.25L7.75 9.75L12.25 14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
	</svg>
);

export default ChevronLeft;
