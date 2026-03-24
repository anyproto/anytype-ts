import React from 'react';

const Syncing = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<circle cx="6" cy="6" r="5.5" stroke="currentColor" strokeWidth="1" />
		<line x1="6" y1="6" x2="6" y2="3.5" stroke="currentColor" strokeWidth="1">
			<animateTransform attributeName="transform" type="rotate" from="0 6 6" to="30 6 6" dur="2s" repeatCount="indefinite" />
		</line>
		<line x1="6" y1="6" x2="6" y2="3.5" stroke="currentColor" strokeWidth="1">
			<animateTransform attributeName="transform" type="rotate" from="0 6 6" to="360 6 6" dur="2s" repeatCount="indefinite" />
		</line>
	</svg>
);

export default Syncing;
