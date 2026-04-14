import React from 'react';

const P2p = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<rect x="3.625" y="5.125" width="12.75" height="8.75" rx="0.875" stroke="currentColor" strokeWidth="1.25" />
		<mask id="p2p-mask" fill="white">
			<rect x="8.5" y="4.5" width="3" height="2" rx="0.5" />
		</mask>
		<rect x="8.5" y="4.5" width="3" height="2" rx="0.5" stroke="currentColor" strokeWidth="2" mask="url(#p2p-mask)" />
		<rect x="0.375" y="-0.375" width="17.25" height="0.75" rx="0.375" transform="matrix(1 0 0 -1 1 13.7295)" stroke="currentColor" strokeWidth="0.75" />
	</svg>
);

export default P2p;
