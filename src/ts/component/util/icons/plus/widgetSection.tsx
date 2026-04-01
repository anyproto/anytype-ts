import React from 'react';

const WidgetSection = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<rect x="5.25" y="1" width="1.5" height="10" rx="0.75" fill="currentColor" />
		<rect x="1" y="6.75" width="1.5" height="10" rx="0.75" transform="rotate(-90 1 6.75)" fill="currentColor" />
	</svg>
);

export default WidgetSection;
