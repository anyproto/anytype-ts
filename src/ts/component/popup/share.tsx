import React, { FC } from 'react';
import { Title, Label, Button } from 'Component';
import * as I from 'Interface';

const PopupShare: FC<I.Popup> = () => {

	const onClick = () => {
		U.Common.copyToast(translate('commonLink'), J.Url.share);
		analytics.event('ClickShareAppCopyLink');
	};

	return (
		<>
			<Title text={translate('popupShareTitle')} />
			<Label text={translate('popupShareLabel')} />

			<div className="section">
				<Label text={U.String.sprintf(translate('popupShareLinkText'), J.Url.share, J.Url.share)} />
			</div>

			<Button text={translate('commonCopyLink')} onClick={onClick} />
		</>
	);
};

export default PopupShare;