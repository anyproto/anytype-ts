import React from 'react';

interface DotIndicatorProps {
	index: number;
	count: number;
	className?: string;
};
	
class DotIndicator extends React.Component<DotIndicatorProps> {

	render () {
		const { index, count, className } = this.props;
		const dots = [];

		for (let i = 0; i < count; i++) {
			const isActive = i === index;
			const cn = ['dot'];

			if (isActive) {
				cn.push('active');
			};

			dots.push(<span	key={i} className={cn.join(' ')} />);
		};

		return <div className={['dotIndicator', className].join(' ')}>{dots}</div>;
	};

};

export default DotIndicator;