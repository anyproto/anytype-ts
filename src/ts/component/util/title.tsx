import React, { forwardRef, useEffect, useRef } from 'react';
import * as I from 'Interface';

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
			U.Dom.renderLinks(nodeRef.current);
		};
	}, []);

	return (
		<div
			ref={nodeRef}
			className={[ 'title', className ].join(' ')}
			dangerouslySetInnerHTML={{ __html: U.String.sanitize(text) }}
			{...U.Common.dataProps({ ...dataset, content: text, 'animation-type': I.AnimType.Text })}
		/>
	);
});

export default Title;
