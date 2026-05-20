import React from 'react';

const Sidebar = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<rect x="4" y="10.5" width="1" height="10" transform="rotate(-90 4 10.5)" fill="currentColor"/>
		<path d="M8 14L4 10L8 6" stroke="currentColor"/>
		<rect x="16" y="5" width="1" height="10" fill="currentColor"/>
	</svg>
);

export default Sidebar;
