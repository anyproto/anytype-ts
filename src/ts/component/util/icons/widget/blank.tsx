import React from 'react';

const Blank = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<circle cx="10" cy="10" r="1.5" fill="currentColor"/>
	</svg>
);

export default Blank;
