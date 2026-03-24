import React from 'react';

const Item = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M8 14L12 10L8 6" stroke="currentColor" strokeLinecap="round" />
	</svg>
);

export default Item;
