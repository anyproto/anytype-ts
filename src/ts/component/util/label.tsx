import React, { FC, MouseEvent, useEffect, useRef } from 'react';
import $ from 'jquery';
import { I, Preview, U } from 'Lib';

interface Props {
	id?: string;
	text: string;
	color?: string;
	className?: string;
	tooltipParam?: Partial<I.TooltipParam>;
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
  	tooltipParam = {},
	dataset = {},
	onClick,
	onMouseDown,
	onMouseEnter,
	onMouseLeave,
}) => {
	const nodeRef = useRef<HTMLDivElement | null>(null);
	const cn = [ 'label' ];
	const dataProps = { ...dataset };

	if (className.match(/animation/)) {
		dataProps['animation-type'] = I.AnimType.Text;
		dataProps.content = text;
	};

	if (className) {
		cn.push(className);
	};
	if (color) {
		cn.push(`textColor textColor-${color}`);
	};

	const mouseEnterHandler = (e: MouseEvent) => {
		const { text = '', caption = '' } = tooltipParam;
		const t = Preview.tooltipCaption(text, caption);

		if (t) {
			Preview.tooltipShow({ ...tooltipParam, text: t, element: $(nodeRef.current) });
		};

		if (onMouseEnter) {
			onMouseEnter(e);
		};
	};

	const mouseLeaveHandler = (e: MouseEvent) => {
		Preview.tooltipHide(false);

		if (onMouseLeave) {
			onMouseLeave(e);
		};
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
			onMouseEnter={mouseEnterHandler}
			onMouseLeave={mouseLeaveHandler}
			{...U.Common.dataProps(dataProps)}
		/>
	);

};

export default Label;
