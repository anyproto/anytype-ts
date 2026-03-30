import React from 'react';

const DataviewDnd = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<rect x="5" width="2" height="2" rx="1" fill="currentColor" />
		<rect x="5" y="5" width="2" height="2" rx="1" fill="currentColor" />
		<rect x="5" y="10" width="2" height="2" rx="1" fill="currentColor" />
		<rect width="2" height="2" rx="1" fill="currentColor" />
		<rect y="5" width="2" height="2" rx="1" fill="currentColor" />
		<rect y="10" width="2" height="2" rx="1" fill="currentColor" />
	</svg>
);

export default DataviewDnd;
