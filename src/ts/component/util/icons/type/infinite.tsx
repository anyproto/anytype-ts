import React from 'react';

const Infinite = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M256,256s-48-96-126-96c-54.12,0-98,43-98,96s43.88,96,98,96c30,0,56.45-13.18,78-32" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeMiterlimit: '10', strokeWidth: '48px' }}/><path d="M256,256s48,96,126,96c54.12,0,98-43,98-96s-43.88-96-98-96c-29.37,0-56.66,13.75-78,32" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeMiterlimit: '10', strokeWidth: '48px' }}/>
	</svg>
);

export default Infinite;
