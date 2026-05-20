import React from 'react';

const Clear = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path fillRule="evenodd" clipRule="evenodd" d="M10 16.5C13.5899 16.5 16.5 13.5899 16.5 10C16.5 6.41015 13.5899 3.5 10 3.5C6.41015 3.5 3.5 6.41015 3.5 10C3.5 13.5899 6.41015 16.5 10 16.5ZM10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" fill="currentColor"/>
		<rect x="12.8359" y="6.10254" width="1.5" height="9.52463" rx="0.75" transform="rotate(45 12.8359 6.10254)" fill="currentColor"/>
		<rect width="1.5" height="9.52463" rx="0.75" transform="matrix(-0.707107 0.707107 0.707107 0.707107 7.16406 6.10254)" fill="currentColor"/>
	</svg>
);

export default Clear;
