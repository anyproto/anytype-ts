import React, { FC, MouseEvent } from 'react';
import { Icon, Label } from 'Component';
import { S, translate, Storage, analytics } from 'Lib';

interface Props {
	onClose?: () => void;
};

const ShareBanner: FC<Props> = ({ 
	onClose,
}) => {

	const onClickHandler = () => {
		S.Popup.open('settings', { 
			className: 'isSpace',
			data: { 
				page: 'spaceShare', 
				isSpace: true,
			},
		});

		analytics.event('ClickOnboardingTooltip', { id: 'SpaceShare', type: 'OpenSettings' });
	};

	const onCloseHandler = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		Storage.set('shareBannerClosed', true);
		if (onClose) {
			onClose();
		};

		analytics.event('ClickOnboardingTooltip', { id: 'SpaceShare', type: 'Close' });
	};

	return (
		<div
			id="shareBanner"
			className="shareBanner"
			onClick={onClickHandler}
		>
			<Icon className="close" onClick={onCloseHandler} />
			<div className="bannerInner">
				<Label text={translate('shareBannerLabel')} />
				<Icon className="smile" />
			</div>
		</div>
	);
};

export default ShareBanner;