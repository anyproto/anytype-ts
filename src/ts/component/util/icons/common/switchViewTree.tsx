import React from 'react';

const SwitchViewTree = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<rect x="3.5" y="4.249" width="2.5" height="2.5" rx="1.25" fill="currentColor"/>
		<rect x="7.5" y="4.874" width="9" height="1.25" rx="0.625" fill="currentColor"/>
		<rect x="5.5" y="8.749" width="2.5" height="2.5" rx="1.25" fill="currentColor"/>
		<rect x="9.5" y="9.374" width="7" height="1.25" rx="0.625" fill="currentColor"/>
		<rect x="7.5" y="13.249" width="2.5" height="2.5" rx="1.25" fill="currentColor"/>
		<rect x="11.5" y="13.874" width="5" height="1.25" rx="0.625" fill="currentColor"/>
	</svg>
);

export default SwitchViewTree;
