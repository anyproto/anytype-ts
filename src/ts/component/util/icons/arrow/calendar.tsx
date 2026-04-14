import React from 'react';

const Calendar = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M11.5 5.5L7 10L11.5 14.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
	</svg>
);

export default Calendar;
