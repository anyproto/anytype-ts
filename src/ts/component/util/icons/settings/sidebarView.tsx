import React from 'react';

const SidebarView = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<rect x="2" y="8" width="16" height="4" rx="2" fill="currentColor"/>
		<rect x="2" y="3" width="16" height="4" rx="2" fill="currentColor"/>
		<rect x="2" y="13" width="16" height="4" rx="2" fill="currentColor"/>
	</svg>

);

export default SidebarView;
