import React from 'react';

const TemplateBig = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<rect x="11.25" y="2.75" width="1.5" height="20" rx="0.75" fill="currentColor" />
		<rect x="22" y="12" width="1.5" height="20" rx="0.75" transform="rotate(90 22 12)" fill="currentColor" />
	</svg>
);

export default TemplateBig;
