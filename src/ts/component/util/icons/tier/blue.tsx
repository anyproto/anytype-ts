import React from 'react';

const Blue = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<circle cx="33" cy="33" r="33" transform="rotate(-90 33 33)" fill="url(#paint0_radial_blue)" />
		<circle cx="33" cy="87" r="33" transform="rotate(-90 33 87)" fill="url(#paint1_radial_blue)" />
		<circle cx="87" cy="33" r="33" transform="rotate(-90 87 33)" fill="url(#paint2_radial_blue)" />
		<circle cx="87" cy="87" r="33" transform="rotate(-90 87 87)" fill="url(#paint3_radial_blue)" />
		<defs>
			<radialGradient id="paint0_radial_blue" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(33 33) rotate(90) scale(33)">
				<stop offset="0.41" stopColor="#A5AEFF" stopOpacity="0" />
				<stop offset="1" stopColor="#A5AEFF" />
			</radialGradient>
			<radialGradient id="paint1_radial_blue" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(33 87) rotate(90) scale(33)">
				<stop offset="0.41" stopColor="#A5AEFF" stopOpacity="0" />
				<stop offset="1" stopColor="#A5AEFF" />
			</radialGradient>
			<radialGradient id="paint2_radial_blue" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(87 33) rotate(90) scale(33)">
				<stop offset="0.41" stopColor="#A5AEFF" stopOpacity="0" />
				<stop offset="1" stopColor="#A5AEFF" />
			</radialGradient>
			<radialGradient id="paint3_radial_blue" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(87 87) rotate(90) scale(33)">
				<stop offset="0.41" stopColor="#A5AEFF" stopOpacity="0" />
				<stop offset="1" stopColor="#A5AEFF" />
			</radialGradient>
		</defs>
	</svg>
);

export default Blue;
