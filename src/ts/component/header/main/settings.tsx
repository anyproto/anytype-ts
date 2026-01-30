import React, { forwardRef, useEffect, useState } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { S, I, U, translate, analytics, keyboard, sidebar, Relation } from 'Lib';
import { Icon, Label } from 'Component';

const HeaderMainSettings = observer(forwardRef<{}, I.HeaderComponent>((props, ref) => {

	const { isPopup } = props;
	const [ invite, setInvite ] = useState({ cid: '', key: '' });
	const { id = 'account' } = keyboard.getMatch(isPopup).params;
	const profile = U.Space.getProfile();
	const participant = U.Space.getParticipant() || profile;
	const globalName = Relation.getStringValue(participant?.globalName);
	const space = U.Space.getSpaceview();
	const isOwner = U.Space.isMyOwner();
	const showTransfer = U.Space.canTransferOwnership();

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
			U.Menu.spaceContext(space, menuParam, { 
				isSharePage: true, 
				noManage: true,
				route: analytics.route.settings,
			});
		} else {
			U.Menu.spaceSettingsIndex(menuParam, { route: analytics.route.settings });
		};
	};

	const onOneToOne = () => {
		S.Menu.open('oneToOne', {
			element: '#button-share-one-to-one',
			horizontal: I.MenuDirection.Right,
		});
	};

	const renderIdentity = () => {
		if (![ 'account', 'index' ].includes(id) || !globalName) {
			return null;
		};

		return (
			<div id="settings-identity-badge" className="identity">
				<Icon className="badge" />
				<Label text={globalName} />
			</div>
		);
	};

	const renderMore = () => {
		const hasLink = invite.cid && invite.key;
		const spaceShareShowButton = hasLink || (isOwner && space.isShared);

		if (id == 'account') {
			return <Icon id="button-share-one-to-one" className="oneToOne withBackground" onClick={onOneToOne} />;
		};

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

	const onTransferOwnership = () => {
		S.Menu.open('changeOwner', {
			recalcRect: () => {
				const { ww, wh } = U.Common.getWindowDimensions();
				return { x: 0, y: 0, width: ww, height: wh };
			},
			classNameWrap: 'fixed',
			visibleDimmer: true,
			vertical: I.MenuDirection.Center,
			horizontal: I.MenuDirection.Center,
		});

		analytics.event('ClickTransferSpaceOwnership', { route: analytics.route.settings });
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
			<div className="side right">
				{showTransfer ? (
					<Label
						text={translate('popupSettingsSpaceShareTransferOwnership')}
						className="btn"
						onClick={onTransferOwnership}
						onDoubleClick={e => e.stopPropagation()}
					/>
				) : ''}
				{renderMore()}
			</div>
		</>
	);

}));

export default HeaderMainSettings;
