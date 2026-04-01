import React from 'react';

const Bookmark = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M4 5C4 3.34315 5.34315 2 7 2H13C14.6569 2 16 3.34315 16 5V18.5L10 15.0625L4 18.5V5Z" fill="currentColor"/>
	</svg>
);

export default Bookmark;
