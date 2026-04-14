import React from 'react';

const Resize = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
		<polyline points="304 96 416 96 416 208" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '32px' }}/><line x1="405.77" y1="106.2" x2="111.98" y2="400.02" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '32px' }}/><polyline points="208 416 96 416 96 304" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '32px' }}/>
	</svg>
);

export default Resize;
