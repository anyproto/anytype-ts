import React, { FC } from 'react';
import { Icon, Label } from 'Component';

interface Props {
	text: string;
	onClick?: () => void;
};

const ShareTooltip: FC<Props> = ({
	text = '',
	onClick,
}) => {

	return (
		<div
			className="shareTooltip"
			onClick={onClick}
		>
			<Icon className="smile" />
			<Label text={text} />
		</div>
	);

};

export default ShareTooltip;