import React, { FC, MouseEvent } from 'react';
import { observer } from 'mobx-react';
import { Icon, Label } from 'Component';
import { S, translate, analytics } from 'Lib';

interface Props {
	route: string;
	showOnce?: boolean;
};

const ShareTooltip: FC<Props> = observer(({ 
	route = '',
	showOnce = false,
}) => {
	const { shareTooltip } = S.Common;

	if (showOnce && shareTooltip) {
		return null;
	};

	const hide = () => S.Common.shareTooltipSet(true);

	const onClickHandler = () => {
		S.Popup.open('share', {});
		hide();

		analytics.event('ClickShareApp', { route });
	};

	const onCloseHandler = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		hide();
	};

	return (
		<div
			className="shareTooltip"
			onClick={onClickHandler}
		>
			<Icon className="close" onClick={onCloseHandler} />
			<Icon className="smile" />
			<Label text={translate('shareTooltipLabel')} />
		</div>
	);
});

export default ShareTooltip;