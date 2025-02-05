import React, { forwardRef } from 'react';
import { Label, Icon, Title } from 'Component';
import { I, U, translate, S } from 'Lib';

const PopupSettingsSpaceInfo = forwardRef<{}, I.Popup>((props, ref) => {

	const { account } = S.Auth;
	const space = U.Space.getSpaceview();
	const creator = U.Space.getCreator(space.targetSpaceId, space.creator);

	return (
		<div
			className="wrapper"
		>
			<div className="sectionContent">

				<div
					className="item"
					onClick={() => U.Common.copyToast(translate(`popupSettingsSpaceIndexSpaceIdTitle`), space.targetSpaceId)}
				>
					<div className="sides">
						<div className="side left">
							<Title text={translate(`popupSettingsSpaceIndexSpaceIdTitle`)} />
							<Label text={space.targetSpaceId} />
						</div>
						<div className="side right">
							<Icon className="copy" />
						</div>
					</div>
				</div>

				<div
					className="item"
					onClick={() => U.Common.copyToast(translate('popupSettingsAccountAnytypeIdentityTitle'), account.id)}
				>
					<div className="sides">
						<div className="side left">
							<Title text={translate(`popupSettingsSpaceIndexCreatedByTitle`)} />
							<Label text={creator.globalName || creator.identity} />
						</div>
						<div className="side right">
							<Icon className="copy" />
						</div>
					</div>
				</div>

				<div
					className="item"
					onClick={() => U.Common.copyToast(translate(`popupSettingsSpaceIndexNetworkIdTitle`), account.info.networkId)}
				>
					<div className="sides">
						<div className="side left">
							<Title text={translate(`popupSettingsSpaceIndexNetworkIdTitle`)} />
							<Label text={account.info.networkId} />
						</div>
						<div className="side right">
							<Icon className="copy" />
						</div>
					</div>
				</div>

				{space.createdDate ? (
					<div className="item">
						<div className="sides">
							<div className="side left">
								<Title text={translate(`popupSettingsSpaceIndexCreationDateTitle`)} />
								<Label text={U.Date.dateWithFormat(S.Common.dateFormat, space.createdDate)} />
							</div>
						</div>
					</div>
				) : ''}
			</div>
		</div>
	);

});

export default PopupSettingsSpaceInfo;
