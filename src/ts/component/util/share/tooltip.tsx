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
			<Icon name="banner/smile" color="default" width={80} height={40} />
			<Label text={text} />
		</div>
	);

};

export default ShareTooltip;