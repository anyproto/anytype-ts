import React from 'react';

const Lock = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<rect x="15" y="2" width="26" height="52" rx="13" stroke="currentColor" strokeWidth="4" />
		<path d="M14 24C9.58172 24 6 27.5817 6 32V48C6 52.4183 9.58172 56 14 56H42C46.4183 56 50 52.4183 50 48V32C50 27.5817 46.4183 24 42 24H14ZM28 34C30.2091 34 32 35.7909 32 38C32 39.4802 31.1951 40.7711 30 41.4629V46C30 47.1046 29.1046 48 28 48C26.8954 48 26 47.1046 26 46V41.4629C24.8049 40.7711 24 39.4802 24 38C24 35.7909 25.7909 34 28 34Z" fill="currentColor" />
	</svg>
);

export default Lock;
