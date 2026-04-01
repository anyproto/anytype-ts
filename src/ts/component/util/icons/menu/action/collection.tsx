import React from 'react';

const Collection = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<circle cx="6" cy="6" r="2.25" stroke="currentColor" strokeWidth="1.5"/>
		<circle cx="6" cy="14" r="2.25" stroke="currentColor" strokeWidth="1.5"/>
		<circle cx="14" cy="6" r="2.25" stroke="currentColor" strokeWidth="1.5"/>
		<circle cx="14" cy="14" r="2.25" stroke="currentColor" strokeWidth="1.5"/>
	</svg>
);

export default Collection;
