import React from 'react';

const CloseCircle = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M256,48C141.31,48,48,141.31,48,256s93.31,208,208,208,208-93.31,208-208S370.69,48,256,48Zm75.31,260.69a16,16,0,1,1-22.62,22.62L256,278.63l-52.69,52.68a16,16,0,0,1-22.62-22.62L233.37,256l-52.68-52.69a16,16,0,0,1,22.62-22.62L256,233.37l52.69-52.68a16,16,0,0,1,22.62,22.62L278.63,256Z"/>
	</svg>
);

export default CloseCircle;
