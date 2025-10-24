import React, { forwardRef } from 'react';

interface Props {
	className?: string;
	onClick?(e: any): void;
	onMouseDown?(e: any): void;
};

const Dimmer = forwardRef<HTMLDivElement, Props>(({
	className = '',
	onClick,
	onMouseDown,
}, ref) => {
	return (
		<div 
			ref={ref} 
			className={[ 'dimmer', className ].join(' ')} 
			onClick={onClick}
			onMouseDown={onMouseDown}
		/>
	);
});

export default Dimmer;