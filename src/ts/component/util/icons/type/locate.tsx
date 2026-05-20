import React from 'react';

const Locate = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
		<line x1="256" y1="96" x2="256" y2="56" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '48px' }}/><line x1="256" y1="456" x2="256" y2="416" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '48px' }}/><path d="M256,112A144,144,0,1,0,400,256,144,144,0,0,0,256,112Z" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '48px' }}/><line x1="416" y1="256" x2="456" y2="256" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '48px' }}/><line x1="56" y1="256" x2="96" y2="256" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '48px' }}/>
	</svg>
);

export default Locate;
