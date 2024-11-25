import React, { FC, useEffect, useRef } from 'react';
import $ from 'jquery';
import { I, U } from 'Lib';

interface Props {
	id?: string;
	text: string;
	color?: string;
	className?: string;
	dataset?: any;
	onMouseEnter?: (e: any) => void;
	onMouseLeave?: (e: any) => void;
	onMouseDown?: (e: any) => void;
	onClick?: (e: any) => void;
};

const Label: FC<Props> = ({
	id = '',
	text = '',
	color = '',
	className = '',
	dataset = {},
	onClick,
	onMouseDown,
	onMouseEnter,
	onMouseLeave,
}) => {
	const nodeRef = useRef<HTMLDivElement | null>(null);
	const cn = [ 'label' ];

	if (className) {
		cn.push(className);
	};
	if (color) {
		cn.push(`textColor textColor-${color}`);
	};

	useEffect(() => {
		if (nodeRef.current) {
			U.Common.renderLinks($(nodeRef.current));
		};
	}, []);

	return (
		<div
			ref={nodeRef}
			id={id}
			className={cn.join(' ')}
			dangerouslySetInnerHTML={{ __html: U.Common.sanitize(text) }}
			onClick={onClick}
			onMouseDown={onMouseDown}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			{...U.Common.dataProps({ ...dataset, content: text, 'animation-type': I.AnimType.Text })}
		/>
	);

};

export default Label;