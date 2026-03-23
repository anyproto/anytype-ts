import React from 'react';

const LongText = (props: React.SVGProps<SVGSVGElement>) => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" {...props}>
		<rect x="3.5" y="9.37305" width="13" height="1.25" rx="0.625" fill="currentColor" />
		<rect x="3.5" y="4.87305" width="13" height="1.25" rx="0.625" fill="currentColor" />
		<rect x="3.5" y="13.873" width="7" height="1.25" rx="0.625" fill="currentColor" />
	</svg>
);

export default LongText;
