import React from 'react';

const SidebarView = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<rect x="3" y="5" width="14" height="2" rx="1" fill="currentColor" />
		<rect x="3" y="9" width="14" height="2" rx="1" fill="currentColor" />
		<rect x="3" y="13" width="14" height="2" rx="1" fill="currentColor" />
	</svg>
);

export default SidebarView;
