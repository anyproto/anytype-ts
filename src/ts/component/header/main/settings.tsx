import React, { forwardRef, useState } from 'react';
import { observer } from 'mobx-react';
import { I, S, U, translate, Relation } from 'Lib';
import { Icon, Label, Title, Button } from 'Component';

const HeaderMainSettings = observer(forwardRef<{}, I.HeaderComponent>((props, ref) => {
	const { renderLeftIcons } = props;
	const { account } = S.Auth;
	const profile = U.Space.getProfile();
	const participant = U.Space.getParticipant() || profile;
	const anyName = Relation.getStringValue(participant?.globalName);

	const onIdentity = () => {
		if (!anyName) {
			S.Menu.open('identity', {
				element: '#settings-identity-badge',
				horizontal: I.MenuDirection.Center,
			});
		};
	};

	const renderIdentity = () => {
		const param = U.Router.getParam(U.Router.getRoute());
		const id = param.id || 'account';
		const showId = [ 'account', 'index' ];

		if (!showId.includes(id)) {
			return '';
		};

		return (
			<div id="settings-identity-badge" className="identity" onClick={onIdentity}>
				<Icon className={anyName ? 'anyName' : 'info'} />
				<Label text={anyName ? anyName : U.Common.shortMask(account.id, 6)} />
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
