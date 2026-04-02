import React from 'react';

const SwitchViewTree = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<rect x="4" y="4" width="12" height="2.5" rx="1.25" fill="currentColor"/>
		<rect x="8" y="8.75" width="8" height="2.5" rx="1.25" fill="currentColor"/>
		<rect x="12" y="13.5" width="4" height="2.5" rx="1.25" fill="currentColor"/>
	</svg>
);

export default SwitchViewTree;
