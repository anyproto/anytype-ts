import React from 'react';

const Preview = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<circle cx="1.5" cy="7" r="1.5" fill="currentColor"/>
		<circle cx="1.5" cy="12" r="1.5" fill="currentColor"/>
		<circle cx="1.5" cy="2" r="1.5" fill="currentColor"/>
		<rect x="5" y="1.25" width="11" height="1.5" rx="0.75" fill="currentColor"/>
		<rect x="5" y="6.25" width="11" height="1.5" rx="0.75" fill="currentColor"/>
		<rect x="5" y="11.25" width="11" height="1.5" rx="0.75" fill="currentColor"/>
	</svg>
);

export default Preview;
