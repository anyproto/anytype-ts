import React, { forwardRef, useEffect, useState, MouseEvent } from 'react';
import { Icon, Label } from 'Component';
import * as I from 'Interface';

const HeaderMainSettings = forwardRef<{}, I.HeaderComponent>((props, ref) => {

	const { isPopup } = props;
	const [ invite, setInvite ] = useState({ cid: '', key: '' });
	const { id = 'account' } = keyboard.getMatch(isPopup).params;
	const profile = U.Space.getProfile();
	const participant = U.Space.getParticipant() || profile;
	const globalName = Relation.getStringValue(participant?.globalName);
	const space = U.Space.getSpaceview();
	const canModerate = U.Space.canMyParticipantModerate();
	const showTransfer = (id == 'spaceShare') && U.Space.canTransferOwnership();

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
		const element = '#header #button-header-more';
		const menuParam = {
			element,
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
			onOpen: () => U.Dom.addClass(U.Dom.select('#header #button-header-more'), 'active'),
			onClose: () => U.Dom.removeClass(U.Dom.select('#header #button-header-more'), 'active'),
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
		if (space.isOneToOne && (id == 'spaceIndex')) {
			const otherParticipant = U.Space.getOneToOneParticipant(space);
			const otherGlobalName = otherParticipant?.globalName || '';
			const otherIdentity = space.oneToOneIdentity || '';
			const otherAnyName = otherGlobalName || (otherIdentity ? U.String.shortMask(otherIdentity, 6) : '');

			if (!otherAnyName) {
				return null;
			};

			const onAnyNameClick = (e: MouseEvent) => {
				e.preventDefault();
				e.stopPropagation();

				if (otherGlobalName) {
					U.Common.copyToast(translate('commonAnyName'), otherGlobalName);
				} else
				if (otherIdentity) {
					U.Common.copyToast(translate('blockFeaturedIdentity'), otherIdentity);
				};
			};

			return (
				<div className="identity" onClick={onAnyNameClick}>
					{otherGlobalName ? <Icon name="membership/badge" className="badge" size={18} color="accent100" /> : ''}
					<Label text={otherAnyName} />
				</div>
			);
		};

		if (![ 'account', 'index' ].includes(id) || !globalName) {
			return null;
		};

		return (
			<div id="settings-identity-badge" className="identity">
				<Icon name="membership/badge" className="badge" size={18} color="accent100" />
				<Label text={globalName} />
			</div>
		);
	};

	const renderMore = () => {
		const hasLink = invite.cid && invite.key;
		const spaceShareShowButton = hasLink || (canModerate && space.isShared);

		if (id == 'account') {
			return <Icon id="button-share-one-to-one" name="header/oneToOne" withBackground={true} onClick={onOneToOne} />;
		};

		if (![ 'spaceIndex', 'spaceShare' ].includes(id)) {
			return null;
		};

		if (id == 'spaceShare' && !spaceShareShowButton) {
			return null;
		};

		return (
			<Icon
				id="button-header-more"
				tooltipParam={{ text: translate('commonMenu'), typeY: I.MenuDirection.Bottom }}
				name="common/more" withBackground={true}
				onClick={onMore}
				onDoubleClick={e => e.stopPropagation()}
			/>
		);
	};

	const onTransferOwnership = () => {
		S.Menu.open('changeOwner', {
			recalcRect: () => {
				const { ww, wh } = U.Dom.getWindowDimensions();
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
						name="header/widget" withBackground={true}
						onClick={() => sidebar.leftPanelSubPageToggle('widget', true, true)}
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

});

export default HeaderMainSettings;
