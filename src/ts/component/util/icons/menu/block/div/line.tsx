import React from 'react';

const Line = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M1 10C1 9.58579 1.33579 9.25 1.75 9.25H18.25C18.6642 9.25 19 9.58579 19 10C19 10.4142 18.6642 10.75 18.25 10.75H1.75C1.33579 10.75 1 10.4142 1 10Z" fill="currentColor"/>
	</svg>
);

export default Line;
