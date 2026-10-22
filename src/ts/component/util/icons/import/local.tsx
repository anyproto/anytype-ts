import React from 'react';

/**
 * Marks a provider that runs on the user's own machine. Uses currentColor so the
 * theme drives it and no dark variant is needed.
 */
const Local = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M10 2.25L4.25 4.55V9.6c0 3.53 2.32 6.78 5.75 8.15 3.43-1.37 5.75-4.62 5.75-8.15V4.55L10 2.25z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
		<path d="M7.4 9.9l1.85 1.85 3.35-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

export default Local;
