import React from 'react';

const StarHalf = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M480,208H308L256,48,204,208H32l140,96L118,464,256,364,394,464,340,304Z" style={{ fill: 'none', stroke: 'currentColor', strokeLinejoin: 'round', strokeWidth: '32px' }}/><polygon points="256 48 256 364 118 464 172 304 32 208 204 208 256 48"/>
	</svg>
);

export default StarHalf;
