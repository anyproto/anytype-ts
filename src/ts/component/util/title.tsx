import React, { useEffect, useRef } from 'react';
import { I, U } from 'Lib';
import $ from 'jquery';

interface Props {
	text: string;
	className?: string;
	dataset?: any;
};

const Title: React.FC<Props> = ({ 
	text = '',
	className = '', 
	dataset = {},
}) => {
	const nodeRef = useRef<HTMLDivElement | null>(null);
	const cn = [ 'title' ];

	if (className) {
		cn.push(className);
	};

	useEffect(() => {
		if (nodeRef.current) {
			U.Common.renderLinks($(nodeRef.current));
		};
	}, []);

	return (
		<div
			ref={nodeRef}
			className={cn.join(' ')}
			dangerouslySetInnerHTML={{ __html: U.Common.sanitize(text) }}
			{...U.Common.dataProps({ ...dataset, content: text, 'animation-type': I.AnimType.Text })}
		/>
	);
};

export default Title;