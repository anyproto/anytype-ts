import React from 'react';

const SwitchView = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<rect x="7.50391" y="9.37402" width="9" height="1.25" rx="0.625" fill="currentColor"/>
		<rect x="3.5" y="8.74902" width="2.5" height="2.5" rx="1.25" fill="currentColor"/>
		<rect x="7.50391" y="4.87402" width="9" height="1.25" rx="0.625" fill="currentColor"/>
		<rect x="3.5" y="4.24902" width="2.5" height="2.5" rx="1.25" fill="currentColor"/>
		<rect x="7.50391" y="13.874" width="9" height="1.25" rx="0.625" fill="currentColor"/>
		<rect x="3.5" y="13.249" width="2.5" height="2.5" rx="1.25" fill="currentColor"/>
	</svg>
);

export default SwitchView;
