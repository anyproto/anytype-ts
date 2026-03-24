import React from 'react';

const Synced = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M5 10L9 14L15 6" stroke="currentColor" strokeWidth="1.5"/>
	</svg>
);

export default Synced;
