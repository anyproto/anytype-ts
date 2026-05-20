import React from 'react';

const TableOfContents = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<rect x="6" y="11.25" width="12" height="1.5" rx="0.75" fill="currentColor"/>
		<rect x="4" y="7.25" width="12" height="1.5" rx="0.75" fill="currentColor"/>
		<rect x="2" y="3.25" width="12" height="1.5" rx="0.75" fill="currentColor"/>
		<rect x="2" y="15.25" width="12" height="1.5" rx="0.75" fill="currentColor"/>
	</svg>
);

export default TableOfContents;
