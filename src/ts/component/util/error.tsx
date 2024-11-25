import React, { forwardRef } from 'react';
import { I, U } from 'Lib';

interface Props {
	id?: string;
	text?: string;
	className?: string;
	dataset?: any;
};

const Error = forwardRef<{}, Props>(({
	id = '',
	text = '',
	className = '',
	dataset = {},
}, ref) => {

	const cn = [ 'error', className ];

	if (!text && !id) {
		return null;
	};

	return (
		<div 
			id={id}
			className={cn.join(' ')}
			dangerouslySetInnerHTML={{ __html: U.Common.sanitize(text) }} 
			{...U.Common.dataProps({ ...dataset, content: text, 'animation-type': I.AnimType.Text })}
		/>
	);

});

export default Error;