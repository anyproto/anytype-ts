import React from 'react';

const DoubleChevron = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M9 9L13.2929 13.2929C13.6834 13.6834 13.6834 14.3166 13.2929 14.7071L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
		<path d="M15 9L19.2929 13.2929C19.6834 13.6834 19.6834 14.3166 19.2929 14.7071L15 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
	</svg>
);

export default DoubleChevron;
