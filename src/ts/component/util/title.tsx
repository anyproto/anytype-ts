import React, { forwardRef, useEffect, useRef } from 'react';
import { I, U } from 'Lib';
import $ from 'jquery';

interface Props {
	text: string;
	className?: string;
	dataset?: any;
};

const Title = forwardRef<{}, Props>(({ 
	text = '',
	className = '', 
	dataset = {},
}, ref) => {
	const nodeRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (nodeRef.current) {
			U.Common.renderLinks($(nodeRef.current));
		};
	}, []);

	return (
		<div
			ref={nodeRef}
			className={[ 'title', className ].join(' ')}
			dangerouslySetInnerHTML={{ __html: U.Common.sanitize(text) }}
			{...U.Common.dataProps({ ...dataset, content: text, 'animation-type': I.AnimType.Text })}
		/>
	);
});

export default Title;