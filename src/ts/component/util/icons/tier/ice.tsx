import React from 'react';

const Ice = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<circle opacity="0.4" cx="32" cy="32" r="32" fill="url(#paint0_radial_ice)" />
		<circle opacity="0.6" cx="32" cy="32" r="18" fill="url(#paint1_radial_ice)" />
		<circle opacity="0.8" cx="32" cy="32" r="4" fill="url(#paint2_radial_ice)" />
		<defs>
			<radialGradient id="paint0_radial_ice" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(32 32) rotate(90) scale(32)">
				<stop offset="0.41" stopColor="#24BFD4" stopOpacity="0" />
				<stop offset="1" stopColor="#24BFD4" />
			</radialGradient>
			<radialGradient id="paint1_radial_ice" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(32 32) rotate(90) scale(18)">
				<stop offset="0.41" stopColor="#24BFD4" stopOpacity="0" />
				<stop offset="1" stopColor="#24BFD4" />
			</radialGradient>
			<radialGradient id="paint2_radial_ice" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(32 32) rotate(90) scale(4)">
				<stop offset="0.285" stopColor="#2AAFC1" stopOpacity="0" />
				<stop offset="1" stopColor="#2AAFC1" />
			</radialGradient>
		</defs>
	</svg>
);

export default Ice;
