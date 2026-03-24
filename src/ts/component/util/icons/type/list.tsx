import React from 'react';

const List = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
		<line x1="160" y1="144" x2="448" y2="144" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '48px' }}/><line x1="160" y1="256" x2="448" y2="256" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '48px' }}/><line x1="160" y1="368" x2="448" y2="368" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '48px' }}/><circle cx="80" cy="144" r="16" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '32px' }}/><circle cx="80" cy="256" r="16" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '32px' }}/><circle cx="80" cy="368" r="16" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '32px' }}/>
	</svg>
);

export default List;
