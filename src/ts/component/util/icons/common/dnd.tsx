import React from 'react';

const Dnd = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<rect x="11" y="4" width="2" height="2" rx="1" fill="currentColor" />
		<rect x="11" y="9" width="2" height="2" rx="1" fill="currentColor" />
		<rect x="11" y="14" width="2" height="2" rx="1" fill="currentColor" />
		<rect x="6" y="4" width="2" height="2" rx="1" fill="currentColor" />
		<rect x="6" y="9" width="2" height="2" rx="1" fill="currentColor" />
		<rect x="6" y="14" width="2" height="2" rx="1" fill="currentColor" />
	</svg>
);

export default Dnd;
