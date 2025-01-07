import React, { forwardRef } from 'react';

interface Props {
	className?: string;
	onClick?(e: any): void;
};

const Dimmer = forwardRef<HTMLDivElement, Props>(({
	className = '',
	onClick,
}, ref) => {
	return (
		<div 
			ref={ref} 
			className={[ 'dimmer', className ].join(' ')} 
			onClick={onClick} 
		/>
	);
});

export default Dimmer;