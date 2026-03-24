import React from 'react';

const Upload = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M4 18V20C4 22.2091 5.79086 24 8 24H20C22.2091 24 24 22.2091 24 20V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
		<path d="M9 9L14 4L19 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
		<path d="M14 4.75C14.4142 4.75 14.75 5.08579 14.75 5.5V18C14.75 18.4142 14.4142 18.75 14 18.75C13.5858 18.75 13.25 18.4142 13.25 18V5.5C13.25 5.08579 13.5858 4.75 14 4.75Z" fill="currentColor" />
	</svg>
);

export default Upload;
