import React, { forwardRef, useEffect, useState } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, U, translate, Relation, analytics, Action, keyboard, sidebar, S } from 'Lib';
import { Icon, Label } from 'Component';

const HeaderMainSettings = observer(forwardRef<{}, I.HeaderComponent>((props, ref) => {

	const { isPopup, menuOpen } = props;
	const [ invite, setInvite ] = useState({ cid: '', key: '' });
	const param = U.Router.getParam(U.Router.getRoute());
	const id = param.id || 'account';
	const profile = U.Space.getProfile();
	const participant = U.Space.getParticipant() || profile;
	const globalName = Relation.getStringValue(participant?.globalName);
	const space = U.Space.getSpaceview();
	const isOwner = U.Space.isMyOwner();

	const init = () => {
		if (space.isShared && (!invite.cid || !invite.key)) {
			U.Space.getInvite(S.Common.space, (cid: string, key: string) => {
				if (cid && key) {
					setInvite({ cid, key });
				};
			});
		} else {
			setInvite({ cid: '', key: '' });
		};
	};

	const onMore = () => {
		const element = $('#header #button-header-more');
		const menuParam = {
			element,
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
			onOpen: () => element.addClass('active'),
			onClose: () => element.removeClass('active'),
		};

		if (id == 'spaceShare') {
			U.Menu.spaceContext(space, menuParam, { isSharePage: true, route: analytics.route.settings });
		} else {
			U.Menu.spaceSettingsIndex(menuParam, { route: analytics.route.settings });
		};
	};

	const renderIdentity = () => {
		if (![ 'account', 'index' ].includes(id) || !globalName) {
			return null;
		};

		return (
			<div id="settings-identity-badge" className="identity">
				<Icon className="anyName" />
				<Label text={globalName} />
			</div>
		);
	};

	const renderMore = () => {
		const hasLink = invite.cid && invite.key;
		const spaceShareShowButton = hasLink || (isOwner && space.isShared);

		if (![ 'spaceIndex', 'spaceIndexEmpty', 'spaceShare' ].includes(id)) {
			return null;
		};

		if (id == 'spaceShare' && !spaceShareShowButton) {
			return null;
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

	useEffect(() => {
		init();
	}, []);

	useEffect(() => {
		init();
	}, [ space.spaceAccessType ]);

	return (
		<>
			<div className="side left">
				{!isPopup ? (
					<Icon 
						className="widgetPanel withBackground" 
						onClick={() => sidebar.leftPanelSubPageToggle('widget')}
						tooltipParam={{ 
							text: translate('commonWidgets'), 
							caption: keyboard.getCaption('widget'), 
							typeY: I.MenuDirection.Bottom,
						}}
					/>
				) : ''}
			</div>
			<div className="side center">{renderIdentity()}</div>
			<div className="side right">{renderMore()}</div>
		</>
	);

}));

export default HeaderMainSettings;
