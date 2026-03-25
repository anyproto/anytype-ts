import React from 'react';

const SwitchView = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<rect x="4.25" y="4.75" width="2.5" height="2.5" rx="1.25" fill="currentColor" />
		<rect x="8.5" y="5.375" width="9" height="1.25" rx="0.625" fill="currentColor" />
		<rect x="4.25" y="8.75" width="2.5" height="2.5" rx="1.25" fill="currentColor" />
		<rect x="8.5" y="9.375" width="9" height="1.25" rx="0.625" fill="currentColor" />
		<rect x="4.25" y="12.75" width="2.5" height="2.5" rx="1.25" fill="currentColor" />
		<rect x="8.5" y="13.375" width="9" height="1.25" rx="0.625" fill="currentColor" />
	</svg>
);

export default SwitchView;
