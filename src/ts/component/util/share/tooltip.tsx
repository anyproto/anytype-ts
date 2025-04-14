import React, { FC } from 'react';
import { observer } from 'mobx-react';
import { Icon, Label } from 'Component';
import { S, translate, analytics } from 'Lib';

interface Props {
	route: string;
};

const ShareTooltip: FC<Props> = observer(({ 
	route = '',
}) => {

	const onClickHandler = () => {
		S.Popup.open('share', {});
		analytics.event('ClickShareApp', { route });
	};

	return (
		<div
			className="shareTooltip"
			onClick={onClickHandler}
		>
			<Icon className="smile" />
			<Label text={translate('shareTooltipLabel')} />
		</div>
	);

});

export default ShareTooltip;