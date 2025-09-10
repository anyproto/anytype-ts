import React, { FC } from 'react';
import { Icon, Label } from 'Component';

interface Props {
	text: string;
	onClick?: () => void;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
};

const ShareTooltip: FC<Props> = ({
	text = '',
	onClick,
	onMouseEnter,
	onMouseLeave,
}) => {

	return (
		<div
			className="shareTooltip"
			onClick={onClick}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			<Icon className="smile" />
			<Label text={text} />
		</div>
	);

};

export default ShareTooltip;