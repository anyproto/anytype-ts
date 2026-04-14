import React from 'react';

const Calendar = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M14.7998 2.5C16.5671 2.5 18 3.93288 18 5.7002V14.2979C18 16.0651 16.5671 17.498 14.7998 17.498H5.2002C3.4329 17.498 2.00003 16.0651 2 14.2979V5.7002C2 3.93288 3.43288 2.5 5.2002 2.5H14.7998ZM4.25 6.25C3.69772 6.25 3.25 6.69772 3.25 7.25V14.2998C3.25 15.3768 4.12324 16.25 5.2002 16.25H14.7998C15.8768 16.25 16.75 15.3768 16.75 14.2998V7.25C16.75 6.69772 16.3023 6.25 15.75 6.25H4.25Z" fill="currentColor"/>
		<rect x="8" y="8" width="1.25" height="1.25" rx="0.4" fill="currentColor"/>
		<rect x="10.75" y="8" width="1.25" height="1.25" rx="0.4" fill="currentColor"/>
		<rect x="13.5" y="8" width="1.25" height="1.25" rx="0.4" fill="currentColor"/>
		<rect x="8" y="10.5" width="1.25" height="1.25" rx="0.4" fill="currentColor"/>
		<rect x="10.75" y="10.5" width="1.25" height="1.25" rx="0.4" fill="currentColor"/>
		<rect x="13.5" y="10.5" width="1.25" height="1.25" rx="0.4" fill="currentColor"/>
		<rect x="5.25" y="10.5" width="1.25" height="1.25" rx="0.4" fill="currentColor"/>
		<rect x="8" y="13" width="1.25" height="1.25" rx="0.4" fill="currentColor"/>
		<rect x="10.75" y="13" width="1.25" height="1.25" rx="0.4" fill="currentColor"/>
		<rect x="5.25" y="13" width="1.25" height="1.25" rx="0.4" fill="currentColor"/>
	</svg>
);

export default Calendar;
