import React, { FC } from 'react';
import { I, U } from 'Lib';

interface Props {
	id?: string;
	text?: string;
	className?: string;
	dataset?: any;
};

const Error: FC<Props> = ({
	id = '',
	text = '',
	className = '',
	dataset = {},
}) => {

	if (!text && !id) {
		return null;
	};

	const cn = [ 'error', className ];

	return (
		<div 
			id={id}
			className={cn.join(' ')}
			dangerouslySetInnerHTML={{ __html: U.Common.sanitize(text) }} 
			{...U.Common.dataProps({ ...dataset, content: text, 'animation-type': I.AnimType.Text })}
		/>
	);

};

export default Error;