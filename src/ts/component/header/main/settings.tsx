import React, { forwardRef, useState } from 'react';
import { observer } from 'mobx-react';
import { I, S, U, translate, Relation, analytics, Action } from 'Lib';
import { Icon, Label, Title, Button } from 'Component';
import $ from 'jquery';

const HeaderMainSettings = observer(forwardRef<{}, I.HeaderComponent>((props, ref) => {
	const { renderLeftIcons, menuOpen } = props;
	const { account } = S.Auth;
	const profile = U.Space.getProfile();
	const participant = U.Space.getParticipant() || profile;
	const globalName = Relation.getStringValue(participant?.globalName);
	const space = U.Space.getSpaceview();
	const isOwner = U.Space.isMyOwner(space.targetSpaceId);

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

	const onMore = () => {
		menuOpen('select', '#button-header-more', {
			horizontal: I.MenuDirection.Right,
			data: {
				options: [
					{ id: 'spaceInfo', name: translate('popupSettingsSpaceIndexSpaceInfoTitle') },
					{ id: 'delete', name: isOwner ? translate('pageSettingsSpaceDeleteSpace') : translate('commonLeaveSpace'), color: 'red' },
				],
				onSelect: (e: React.MouseEvent, option: any) => {

					switch (option.id) {
						case 'spaceInfo': {
							Action.spaceInfo();
							break;
						};

						case 'delete': {
							Action.removeSpace(S.Common.space, analytics.route.settings);
							break;
						};
					};

				},
			}
		});
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

	const renderMore = () => {
		const param = U.Router.getParam(U.Router.getRoute());
		const id = param.id || 'account';
		const showId = [ 'spaceIndex', 'spaceIndexEmpty' ];

		if (!showId.includes(id)) {
			return '';
		};

		return (
			<Icon
				id="button-header-more"
				tooltipParam={{ text: translate('commonMenu'), typeY: I.MenuDirection.Bottom }}
				className="more withBackground"
				onClick={onMore}
				onDoubleClick={e => e.stopPropagation()}
			/>
		);
	};

	return (
		<>
			<div className="side left">{renderLeftIcons(true)}</div>
			<div className="side center">{renderIdentity()}</div>
			<div className="side right">{renderMore()}</div>
		</>
	);

}));

export default HeaderMainSettings;
