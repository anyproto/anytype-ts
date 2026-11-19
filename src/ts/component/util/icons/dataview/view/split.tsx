import React from 'react';

const Split = (props: React.SVGProps<SVGSVGElement>) => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" fill="none" {...props}>
		<rect x="11" y="13" width="34" height="30" rx="3" fill="url(#paint0_linear_split)" />
		<rect x="11.5" y="13.5" width="33" height="29" rx="2.5" stroke="currentColor" />
		<rect x="24" y="13" width="1" height="30" fill="currentColor" />
		<rect x="14" y="19" width="7" height="1" rx="0.5" fill="currentColor" />
		<rect x="14" y="24" width="7" height="1" rx="0.5" fill="currentColor" />
		<rect x="14" y="29" width="7" height="1" rx="0.5" fill="currentColor" />
		<rect x="14" y="34" width="7" height="1" rx="0.5" fill="currentColor" />
		<rect x="28" y="18" width="13" height="2" rx="1" fill="currentColor" />
		<rect x="28" y="24" width="13" height="1" rx="0.5" fill="currentColor" />
		<rect x="28" y="29" width="13" height="1" rx="0.5" fill="currentColor" />
		<rect x="28" y="34" width="8" height="1" rx="0.5" fill="currentColor" />
		<defs>
			<linearGradient id="paint0_linear_split" x1="11" y1="14.5" x2="45.6446" y2="31.9283" gradientUnits="userSpaceOnUse">
				<stop stopColor="#E9E9E9" />
				<stop offset="1" stopColor="#F2F2F2" stopOpacity="0" />
			</linearGradient>
		</defs>
	</svg>
);

export default Split;
