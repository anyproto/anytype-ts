import React from 'react';

const Bullet = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<circle cx="8" cy="8" r="2" fill="currentColor" />
	</svg>
);

export default Bullet;
