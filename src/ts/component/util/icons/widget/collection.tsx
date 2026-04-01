import React from 'react';

const Collection = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<rect x="6" y="10" width="8" height="1" rx="0.5" fill="currentColor"/>
		<rect x="6" y="13" width="8" height="1" rx="0.5" fill="currentColor"/>
		<rect x="6" y="7" width="8" height="1" rx="0.5" fill="currentColor"/>
	</svg>
);

export default Collection;
