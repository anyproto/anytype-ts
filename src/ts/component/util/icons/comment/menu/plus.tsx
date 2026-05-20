import React from 'react';

const Plus = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M7 2.75H11.2578C11.8544 2.75012 12.4268 2.98733 12.8486 3.40918L15.5908 6.15137C16.0127 6.57322 16.2499 7.14561 16.25 7.74219V15C16.25 16.2426 15.2426 17.25 14 17.25H7C5.75736 17.25 4.75 16.2426 4.75 15V5C4.75 3.75736 5.75736 2.75 7 2.75Z" stroke="currentColor" strokeWidth="1.5"/>
		<path d="M10.5 3V7C10.5 7.55228 10.9477 8 11.5 8H15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
	</svg>
);

export default Plus;
