import React, { FC, MouseEvent } from 'react';
import { Icon, Label, Button } from 'Component';

interface Props {
	id?: string;
	text?: string;
	button?: string;
	color?: string;
	onClick?: () => void;
	onClose?: () => void;
};

const Banner: FC<Props> = ({ 
	id = '',
	text = '',
	button = '',
	color = 'green',
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
			onClick={onClick}
		>
			<div className="inner">
				<Label text={text} />
				{button ? <Button text={button} color="simple" /> : ''}
			</div>

			<Icon className="close withBackground" onClick={onCloseHandler} />
		</div>
	);
};

export default Banner;