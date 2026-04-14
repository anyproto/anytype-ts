import React from 'react';

const SortArrow = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<rect x="9.5" y="5" width="1" height="10" fill="currentColor" />
		<path d="M6 11L10 15L14 11" stroke="currentColor" />
	</svg>
);

export default SortArrow;
