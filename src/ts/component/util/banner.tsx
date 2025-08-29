import React, { FC, MouseEvent } from 'react';
import { Icon, Title, Label, Button } from 'Component';

interface Props {
	id?: string;
	title?: string;
	text?: string;
	button?: string;
	buttonColor?: string;
	color?: string;
	onClick?: () => void;
	onClose?: () => void;
};

const Banner: FC<Props> = ({ 
	id = '',
	title = '',
	text = '',
	button = '',
	color = 'green',
	buttonColor = 'simple',
	onClick,
	onClose,
}) => {

	const cn = [ 'banner', color, id ];

	const onCloseHandler = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (onClose) {
			onClose();
		};
	};

	return (
		<div
			id={id}
			className={cn.join(' ')}
		>
			<div className="inner">
				{title ? <Title text={title} /> : '' }
				<Label text={text} />
				{button ? <Button text={button} className="c28" color={buttonColor} onClick={onClick} /> : ''}
			</div>

			<Icon className="close withBackground" onClick={onCloseHandler} />
		</div>
	);
};

export default Banner;
