import React, { forwardRef } from 'react';
import { Title, Icon, Label, Button } from 'Component';
import { I, U, translate } from 'Lib';

const PopupAbout = forwardRef<{}, I.Popup>(() => {

	const version = U.Common.getElectron().version.app;

	return (
		<>
			<div className="iconWrapper">
				<Icon />
			</div>
			<Title text={translate('popupAboutTitle')} />
			<Label text={translate('popupAboutDescription')} />

			<div className="version">
				{U.Common.sprintf(translate('popupAboutVersion'), version)}
				<Button 
					onClick={() => U.Common.copyToast(translate('commonVersion'), version)} 
					text={translate('commonCopy')} 
					className="c28" 
					color="blank" 
				/>
			</div>
			<div className="copyright">{translate('popupAboutCopyright')}</div>
		</>
	);

});

export default PopupAbout;