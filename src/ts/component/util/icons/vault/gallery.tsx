import React from 'react';

const Gallery = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<rect width="14" height="1.5" transform="matrix(0 -1 -1 0 5.75 17)" fill="currentColor" />
		<rect width="14" height="1.5" transform="matrix(0 -1 -1 0 10.75 17)" fill="currentColor" />
		<rect width="14" height="1.5" transform="matrix(-0.173648 -0.984808 -0.984808 0.173648 17.1277 16.7871)" fill="currentColor" />
	</svg>
);

export default Gallery;
