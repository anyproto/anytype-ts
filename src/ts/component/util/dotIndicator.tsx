import React, { forwardRef } from 'react';

interface Props {
	index: number;
	count: number;
	className?: string;
};

const DotIndicator = forwardRef<HTMLDivElement, Props>(({
	index = 0,
	count = 0,
	className = '',
}, ref) => {

	const dots = [];
	const cn = [ 'dotIndicator', className ];

	for (let i = 0; i < count; i++) {
		const isActive = i == index;
		const cn = [ 'dot' ];

		if (isActive) {
			cn.push('active');
		};

		dots.push(<span	key={i} className={cn.join(' ')} />);
	};

	return <div className={cn.join(' ')}>{dots}</div>;
});

export default DotIndicator;