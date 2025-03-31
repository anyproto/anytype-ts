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

	const short = (id) => {
		const l = id.length;

		let ret = '';
		ret += id.substring(0, 6);
		ret += '...';
		ret += id.substring(l - 6);

		return ret;
	};

	const onAnyId = () => {
		if (anyName) {
			return;
		};

		setShowInfo(!showInfo);
	};

	const onButton = () => {
		setShowInfo(false);

		U.Object.openAuto({ id: 'membership', layout: I.ObjectLayout.Settings });
	};

	const renderAnyId = () => {
		const param = U.Router.getParam(U.Router.getRoute());
		const id = param.id || 'account';
		const showId = [ 'account', 'index' ];

		if (!showId.includes(id)) {
			return '';
		};

		return (
			<div className="anyId" onClick={onAnyId}>
				<Icon className={anyName ? 'anyName' : 'info'} />
				<Label text={anyName ? anyName : short(account.id)} />

				{showInfo ? (
					<div className="infoWrapper">
						<div className="iconWrapper">
							<Icon className="anyName" />
						</div>

						<Title text={translate('headerSettingsAnyIdInfoTitle')} />
						<Label text={translate('headerSettingsAnyIdInfoText')} />
						<Button className="c36" text={translate('headerSettingsAnyIdInfoExplorePlans')} onClick={onButton} />
					</div>
				) : ''}
			</div>
		);
	};

	return (
		<>
			<div className="side left">{renderLeftIcons()}</div>
			<div className="side center">{renderAnyId()}</div>
			<div className="side right" />
		</>
	);

}));

export default HeaderMainSettings;
