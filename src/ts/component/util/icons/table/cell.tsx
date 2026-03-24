import React from 'react';

const Cell = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 9 17" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<rect x="3.46875" y="2.81641" width="2" height="2" rx="1" fill="currentColor"/>
		<rect x="3.46875" y="7.81641" width="2" height="2" rx="1" fill="currentColor"/>
		<rect x="3.46875" y="12.8164" width="2" height="2" rx="1" fill="currentColor"/>
	</svg>
);

export default Cell;
