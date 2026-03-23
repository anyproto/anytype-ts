import React from 'react';

const Green = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<circle opacity="0.4" cx="60" cy="60" r="60" fill="url(#paint0_radial_green)" />
		<circle opacity="0.6" cx="60" cy="60.3242" r="33" fill="url(#paint1_radial_green)" />
		<circle opacity="0.8" cx="60" cy="60.3281" r="7.5" fill="url(#paint2_radial_green)" />
		<defs>
			<radialGradient id="paint0_radial_green" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(60 60) rotate(90) scale(60)">
				<stop offset="0.41" stopColor="#24BFD4" stopOpacity="0" />
				<stop offset="1" stopColor="#24BFD4" />
			</radialGradient>
			<radialGradient id="paint1_radial_green" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(60 60.3242) rotate(90) scale(33)">
				<stop offset="0.41" stopColor="#24BFD4" stopOpacity="0" />
				<stop offset="1" stopColor="#24BFD4" />
			</radialGradient>
			<radialGradient id="paint2_radial_green" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(60 60.3281) rotate(90) scale(7.5)">
				<stop offset="0.285" stopColor="#2AAFC1" stopOpacity="0" />
				<stop offset="1" stopColor="#2AAFC1" />
			</radialGradient>
		</defs>
	</svg>
);

export default Green;
