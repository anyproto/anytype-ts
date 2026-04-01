import React from 'react';

const Gallery = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M14 4L30 20L14 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
	</svg>
);

export default Gallery;
