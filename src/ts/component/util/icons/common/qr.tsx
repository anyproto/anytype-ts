import React from 'react';

const Qr = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<rect x="2.75" y="2.75" width="5.5" height="5.5" rx="1.25" stroke="currentColor" strokeWidth="1.5" />
		<rect x="2.75" y="11.75" width="5.5" height="5.5" rx="1.25" stroke="currentColor" strokeWidth="1.5" />
		<rect x="11.75" y="2.75" width="5.5" height="5.5" rx="1.25" stroke="currentColor" strokeWidth="1.5" />
		<rect x="4.5" y="4.5" width="2" height="2" rx="0.5" fill="currentColor" />
		<rect x="4.5" y="13.5" width="2" height="2" rx="0.5" fill="currentColor" />
		<rect x="13.5" y="4.5" width="2" height="2" rx="0.5" fill="currentColor" />
		<rect x="13.5" y="13.5" width="2" height="2" rx="0.5" fill="currentColor" />
		<rect x="11" y="11" width="2" height="2" rx="0.5" fill="currentColor" />
		<rect x="11" y="16" width="2" height="2" rx="0.5" fill="currentColor" />
		<rect x="16" y="11" width="2" height="2" rx="0.5" fill="currentColor" />
		<rect x="16" y="16" width="2" height="2" rx="0.5" fill="currentColor" />
	</svg>
);

export default Qr;
