import React from 'react';

const Purple = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<circle opacity="0.5" cx="32" cy="32" r="32" fill="url(#paint0_radial_purple)" />
		<circle opacity="0.65" cx="32" cy="40" r="22" fill="url(#paint1_radial_purple)" />
		<circle opacity="0.8" cx="32" cy="48" r="12" fill="url(#paint2_radial_purple)" />
		<defs>
			<radialGradient id="paint0_radial_purple" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(32 32) rotate(90) scale(32)">
				<stop offset="0.41" stopColor="#E86DE3" stopOpacity="0" />
				<stop offset="1" stopColor="#E86DE3" />
			</radialGradient>
			<radialGradient id="paint1_radial_purple" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(32 40) rotate(90) scale(22)">
				<stop offset="0.41" stopColor="#E86DE3" stopOpacity="0" />
				<stop offset="1" stopColor="#E86DE3" />
			</radialGradient>
			<radialGradient id="paint2_radial_purple" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(32 48) rotate(90) scale(12)">
				<stop offset="0.41" stopColor="#E86DE3" stopOpacity="0" />
				<stop offset="1" stopColor="#E86DE3" />
			</radialGradient>
		</defs>
	</svg>
);

export default Purple;
