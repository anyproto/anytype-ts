import React from 'react';

const Graph = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M13.999 21C15.1588 21 16.0995 21.9399 16.0996 23.0996C16.0996 24.2594 15.1588 25.2002 13.999 25.2002C12.8393 25.2001 11.8994 24.2593 11.8994 23.0996C11.8995 21.94 12.8394 21.0001 13.999 21ZM13.999 11.2002C15.5454 11.2002 16.7988 12.4536 16.7988 14C16.7987 15.5463 15.5454 16.7998 13.999 16.7998C12.4528 16.7997 11.1993 15.5462 11.1992 14C11.1992 12.4537 12.4527 11.2003 13.999 11.2002ZM13.999 2.7998C15.1587 2.7998 16.0994 3.7398 16.0996 4.89941C16.0996 6.05921 15.1588 7 13.999 7C12.8393 6.99989 11.8994 6.05915 11.8994 4.89941C11.8996 3.73986 12.8394 2.79991 13.999 2.7998Z" fill="currentColor"/>
		<circle cx="6.11865" cy="9.4501" r="2.1" transform="rotate(-60 6.11865 9.4501)" fill="currentColor"/>
		<circle cx="21.8804" cy="18.5497" r="2.1" transform="rotate(-60 21.8804 18.5497)" fill="currentColor"/>
		<circle cx="6.11631" cy="18.5503" r="2.1" transform="rotate(-120 6.11631 18.5503)" fill="currentColor"/>
		<circle cx="21.878" cy="9.44971" r="2.1" transform="rotate(-120 21.878 9.44971)" fill="currentColor"/>
	</svg>
);

export default Graph;
