import React, { FC } from 'react';
import { Title, Label, Button } from 'Component';
import { I, U, J, translate, analytics } from 'Lib';

const PopupShare: FC<I.Popup> = () => {

	const onClick = () => {
		U.Common.copyToast(translate('commonLink'), J.Url.share);
		analytics.event('ClickShareAppCopyLink');
	};

	return (
		<div>
			<Title text={translate('popupShareTitle')} />
			<Label text={translate('popupShareLabel')} />

			<div className="section">
				<Label text={U.Common.sprintf(translate('popupShareLinkText'), J.Url.share, J.Url.share)} />
			</div>

			<Button text={translate('commonCopyLink')} onClick={onClick} />
		</div>
	);
};

export default PopupShare;