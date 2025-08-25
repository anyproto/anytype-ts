import React, { FC } from 'react';
import { Banner, Menu } from 'Component';
import { observer } from 'mobx-react';
import { I, Renderer, S, translate, U } from 'Lib';

const ListBanner: FC = observer(() => {
	const { updateVersion } = S.Common;

	return (
		<>
			{updateVersion ? (
				<Banner
					id="sidebarUpdateBanner"
					title={translate('commonUpdateAvailable')}
					text={U.Common.sprintf(translate('commonNewVersion'), updateVersion)}
					button={translate('commonUpdateApp')}
					buttonColor="black"
					onClick={() => {
						Renderer.send('updateConfirm');
						S.Common.updateVersionSet('');
						U.Common.checkUpdateVersion(updateVersion);
					}}
					onClose={() => {
						S.Common.updateVersionSet('');
						Renderer.send('updateCancel');
					}}
				/>
			) : ''}
		</>
	);
});

export default ListBanner;
