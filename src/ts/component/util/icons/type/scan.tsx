import React from 'react';

const Scan = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M342,444h46a56,56,0,0,0,56-56V342" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '44px' }}/><path d="M444,170V124a56,56,0,0,0-56-56H342" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '44px' }}/><path d="M170,444H124a56,56,0,0,1-56-56V342" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '44px' }}/><path d="M68,170V124a56,56,0,0,1,56-56h46" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '44px' }}/>
	</svg>
);

export default Scan;
