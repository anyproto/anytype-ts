import React, { forwardRef, useState } from 'react';
import { observer } from 'mobx-react';
import { I, S, U, translate, Relation, analytics } from 'Lib';
import { Icon, Label, Title, Button } from 'Component';

const HeaderMainSettings = observer(forwardRef<{}, I.HeaderComponent>((props, ref) => {
	const { renderLeftIcons } = props;
	const { account } = S.Auth;
	const profile = U.Space.getProfile();
	const participant = U.Space.getParticipant() || profile;
	const globalName = Relation.getStringValue(participant?.globalName);

	const onIdentity = () => {
		if (globalName) {
			return;
		};

		S.Menu.open('identity', {
			element: '#settings-identity-badge',
			horizontal: I.MenuDirection.Center,
		});

		analytics.event('ClickUpgradePlanTooltip', { type: 'identity' });
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
				<Icon className={globalName ? 'anyName' : 'info'} />
				<Label text={globalName ? globalName : U.Common.shortMask(account.id, 6)} />
			</div>
		);
	};

	return (
		<>
			<div className="side left">{renderLeftIcons(true)}</div>
			<div className="side center">{renderIdentity()}</div>
			<div className="side right" />
		</>
	);

}));

export default HeaderMainSettings;
