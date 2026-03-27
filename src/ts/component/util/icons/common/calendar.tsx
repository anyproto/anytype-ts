import React from 'react';

const Calendar = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path fillRule="evenodd" clipRule="evenodd" d="M7 2.5C7 2.22386 6.77614 2 6.5 2C6.22386 2 6 2.22386 6 2.5V3H5C3.89543 3 3 3.89543 3 5V15C3 16.1046 3.89543 17 5 17H15C16.1046 17 17 16.1046 17 15V5C17 3.89543 16.1046 3 15 3H14V2.5C14 2.22386 13.7761 2 13.5 2C13.2239 2 13 2.22386 13 2.5V3H7V2.5ZM4 7V15C4 15.5523 4.44772 16 5 16H15C15.5523 16 16 15.5523 16 15V7H4Z" fill="currentColor" />
	</svg>
);

export default Calendar;
