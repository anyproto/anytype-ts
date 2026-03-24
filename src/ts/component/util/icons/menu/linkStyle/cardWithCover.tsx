import React from 'react';

const CardWithCover = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<rect x="2" y="3.25" width="16" height="1.5" rx="0.75" fill="currentColor"/>
		<rect x="2" y="15.25" width="16" height="1.5" rx="0.75" fill="currentColor"/>
		<rect x="2.25" y="6.75" width="3.5" height="6.5" rx="1.25" stroke="currentColor" strokeWidth="0.5"/>
		<rect x="8.25" y="6.75" width="3.5" height="6.5" rx="1.25" stroke="currentColor" strokeWidth="0.5"/>
		<rect x="14.25" y="6.75" width="3.5" height="6.5" rx="1.25" stroke="currentColor" strokeWidth="0.5"/>
	</svg>
);

export default CardWithCover;
