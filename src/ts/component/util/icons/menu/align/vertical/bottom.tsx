import React from 'react';

const Bottom = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<rect x="18" y="18.4609" width="16" height="1.5" rx="0.75" transform="rotate(-180 18 18.4609)" fill="currentColor"/>
		<rect x="13" y="14.7109" width="6" height="12" rx="1" transform="rotate(-180 13 14.7109)" stroke="currentColor" strokeWidth="1.5" />
	</svg>
);

export default Bottom;
