import React from 'react';

const Common = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 8 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<rect x="5" y="14" width="2" height="2" rx="1" transform="rotate(-180 5 14)" fill="currentColor"/>
		<rect x="5" y="9" width="2" height="2" rx="1" transform="rotate(-180 5 9)" fill="currentColor"/>
		<rect x="5" y="4" width="2" height="2" rx="1" transform="rotate(-180 5 4)" fill="currentColor"/>
	</svg>
);

export default Common;
