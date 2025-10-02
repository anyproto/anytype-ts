import React, { forwardRef } from 'react';

interface Props {
	className: string;
	count: number;
	style?: any;
};

const EmptyNodes = forwardRef<{}, Props>(({
	className = '',
	count = 0,
	style = {},
}, ref) => {
	return (
		<>
			{Array(count).fill(null).map((el, i) => <div style={style || {}} className={className} key={i} />)}
		</>
	);
});

export default EmptyNodes;
