import React, { forwardRef, useState } from 'react';
import { observer } from 'mobx-react';
import { I, S, U, keyboard, translate } from 'Lib';
import { Icon, Label, Title, Button } from 'Component';

const HeaderMainSettings = observer(forwardRef<{}, I.HeaderComponent>((props, ref) => {
	const { renderLeftIcons } = props;
	const [ showInfo, setShowInfo ] = useState(false);
	const { account } = S.Auth;
	const profile = U.Space.getProfile();
	const participant = U.Space.getParticipant() || profile;
	const anyName = participant?.globalName.toUpperCase();

	const onIdentity = () => {
		if (anyName) {
			return;
		};

		setShowInfo(!showInfo);
	};

	const onButton = () => {
		setShowInfo(false);

		U.Object.openAuto({ id: 'membership', layout: I.ObjectLayout.Settings });
	};

	const renderIdentity = () => {
		const param = U.Router.getParam(U.Router.getRoute());
		const id = param.id || 'account';
		const showId = [ 'account', 'index' ];

		if (!showId.includes(id)) {
			return '';
		};

		return (
			<div className="identity" onClick={onIdentity}>
				<Icon className={anyName ? 'anyName' : 'info'} />
				<Label text={anyName ? anyName : U.Common.shortMask(account.id, 6)} />

				{showInfo ? (
					<div className="infoWrapper">
						<div className="iconWrapper">
							<Icon className="anyName" />
						</div>

						<Title text={translate('headerSettingsIdentityInfoTitle')} />
						<Label text={translate('headerSettingsIdentityInfoText')} />
						<Button className="c36" text={translate('headerSettingsIdentityInfoExplorePlans')} onClick={onButton} />
					</div>
				) : ''}
			</div>
		);
	};

	return (
		<>
			<div className="side left">{renderLeftIcons()}</div>
			<div className="side center">{renderIdentity()}</div>
			<div className="side right" />
		</>
	);

}));

export default HeaderMainSettings;
