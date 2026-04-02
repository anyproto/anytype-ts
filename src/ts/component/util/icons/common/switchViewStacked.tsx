import React from 'react';

const SwitchViewStacked = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<rect x="4" y="13" width="12" height="2.5" rx="1.25" fill="currentColor"/>
		<rect x="4" y="8.75" width="12" height="2.5" rx="1.25" fill="currentColor" opacity="0.7"/>
		<rect x="4" y="4.5" width="12" height="2.5" rx="1.25" fill="currentColor" opacity="0.4"/>
	</svg>
);

export default SwitchViewStacked;
