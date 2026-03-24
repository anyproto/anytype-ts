import React from 'react';

const Syncing = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<mask id="loader-mask" fill="white">
			<path d="M18.889 10C18.889 14.91 14.91 18.889 10 18.889C5.091 18.889 1.111 14.91 1.111 10C1.111 5.091 5.091 1.111 10 1.111C14.91 1.111 18.889 5.091 18.889 10Z" />
		</mask>
		<path
			d="M18.889 10H16.667C16.667 13.682 13.682 16.667 10 16.667V18.889V21.111C16.137 21.111 21.111 16.137 21.111 10H18.889ZM10 18.889V16.667C6.318 16.667 3.334 13.682 3.334 10H1.111H-1.111C-1.111 16.137 3.864 21.111 10 21.111V18.889ZM1.111 10H3.334C3.334 6.318 6.318 3.334 10 3.334V1.111V-1.111C3.864-1.111-1.111 3.864-1.111 10H1.111ZM10 1.111V3.334C13.682 3.334 16.667 6.318 16.667 10H18.889H21.111C21.111 3.864 16.137-1.111 10-1.111V1.111Z"
			fill="url(#loader-gradient)"
			mask="url(#loader-mask)"
		/>
		<defs>
			<linearGradient id="loader-gradient" x1="10" y1="0" x2="10" y2="20" gradientUnits="userSpaceOnUse">
				<stop stopColor="currentColor" stopOpacity="0" />
				<stop offset="1" stopColor="currentColor" />
			</linearGradient>
		</defs>
	</svg>
);

export default Syncing;
