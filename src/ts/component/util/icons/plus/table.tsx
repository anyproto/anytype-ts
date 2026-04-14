import React from 'react';

const Table = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<rect x="4.71875" width="1.5" height="10" rx="0.75" fill="currentColor" />
		<rect x="10.4688" y="4.25" width="1.5" height="10" rx="0.75" transform="rotate(90 10.4688 4.25)" fill="currentColor" />
	</svg>
);

export default Table;
