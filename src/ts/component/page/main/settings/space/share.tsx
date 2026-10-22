import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { Title, Label, Icon, Button, Switch, Filter, Error, UpsellBanner } from 'Component';
import Members from './share/members';
import * as I from 'Interface';

const PageMainSettingsSpaceShare = forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const [ isLoading, setIsLoading ] = useState(false);
	const [ error, setError ] = useState('');
	const [ search, setSearch ] = useState('');
	const [ isSearching, setIsSearching ] = useState(false);
	const filterRef = useRef<any>(null);
	const switchRef = useRef<any>(null);
	const { space, isOnline } = S.Common;
	const spaceview = U.Space.getSpaceview();
	const invite = S.Common.inviteGet(space);
	const mySharedSpaces = U.Space.getMySharedSpacesList();
	const { sharedSpacesLimit } = U.Space.getProfile();
	const limitReached = sharedSpacesLimit && (mySharedSpaces.length >= sharedSpacesLimit);
	const isLocalNetwork = U.Data.isLocalNetwork();

	// Invite rights belong to the owner alone: admins add members and approve requests, but never
	// see or change the link.
	const canManageInvite = U.Space.canManageInvite() && (!limitReached || spaceview.isShared);
	const canToggleInvite = canManageInvite && isOnline && !isLocalNetwork;
	const canAddMembers = U.Space.canMyParticipantModerate() && (!limitReached || spaceview.isShared);
	const hasLink = U.Space.hasVisibleInvite();
	const isUnsafe = U.Space.isInviteUnsafe();

	const init = () => {
		if (spaceview.isShared) {
			U.Space.getInvite(space);
		} else {
			S.Common.inviteClear(space);
		};
	};

	// Switch keeps its own state and only reads the prop on mount, so it has to be told when the
	// invite it stands for changes underneath it — on load, and when a request fails after the click.
	const syncSwitch = () => {
		switchRef.current?.setValue(!!S.Common.inviteGet(space)?.cid);
	};

	const setErrorHandler = (error: { description: string, code: number }) => {
		setIsLoading(false);

		if (!error.code) {
			return false;
		};

		setError(error.description);
		syncSwitch();
		return true;
	};

	const generate = () => {
		setIsLoading(true);
		setError('');

		// The default invite asks the owner to approve every join, and is kept in their account.
		C.SpaceInviteGenerate(space, I.InviteType.WithApprove, I.ParticipantPermissions.Reader, false, (message: any) => {
			if (setErrorHandler(message.error)) {
				return;
			};

			S.Common.inviteSet(space, {
				cid: message.inviteCid,
				key: message.inviteKey,
				inviteType: message.inviteType,
				permissions: message.permissions,
				heldByOwner: true,
			});

			Preview.toastShow({ text: translate('toastInviteGenerate') });
			analytics.event('ClickShareSpaceNewLink', { type: I.InviteLinkType.Manual });

			if (!spaceview.isShared) {
				analytics.event('ShareSpace');
			};
		});
	};

	const onLinkToggle = (e: any, v: boolean) => {
		if (!v) {
			// The confirm can be cancelled, and the switch has already flipped itself.
			Action.inviteRevoke(space, syncSwitch, syncSwitch);
			return;
		};

		if (spaceview.isShared) {
			generate();
			return;
		};

		setIsLoading(true);
		setError('');

		C.SpaceMakeShareable(space, (message: any) => {
			if (message.error.code == J.Error.Code.SpaceMakeShareable.LIMIT_REACHED) {
				setIsLoading(false);

				S.Popup.open('confirm', {
					data: {
						iconParam: { name: 'popup/header/warning', color: 'grey' },
						title: translate('popupConfirmSharedSpaceLimitTitle'),
						text: U.String.sprintf(translate('popupConfirmSharedSpaceLimitText'), sharedSpacesLimit),
						textConfirm: translate('popupConfirmSharedSpaceLimitButton'),
						canCancel: false,
						onConfirm: () => Action.membershipUpgrade(),
					},
				});
				analytics.event('ScreenHitShareSpaceLimit');
				return;
			};

			if (!setErrorHandler(message.error)) {
				generate();
			};
		});
	};

	const onCopy = () => {
		if (!hasLink) {
			return;
		};

		U.Common.copyToast('', U.Space.getInviteLink(invite.cid, invite.key), translate('toastInviteCopy'));
		analytics.event('ClickShareSpaceCopyLink', { route: analytics.route.settingsSpaceShare });
	};

	const onQr = () => {
		if (!hasLink) {
			return;
		};

		S.Popup.open('inviteQr', { data: { link: U.Space.getInviteLink(invite.cid, invite.key) } });
		analytics.event('ClickSettingsSpaceShare', { type: 'Qr' });
	};

	const onManage = () => {
		S.Popup.open('inviteManage', { data: { spaceId: space } });
	};

	const onAdd = () => {
		S.Popup.open('inviteAdd', { data: { spaceId: space } });
	};

	const onSearch = () => {
		if (isSearching) {
			setSearch('');
		};

		setIsSearching(!isSearching);
	};

	// What the caption tells the owner depends on who can join, with what, and who holds the link.
	const getLinkDescription = (): string => {
		if (!invite || !invite.cid) {
			return translate('popupSettingsSpaceShareLinkDescriptionOff');
		};

		const parts = [];

		if (invite.inviteType == I.InviteType.WithoutApprove) {
			parts.push(translate(invite.permissions == I.ParticipantPermissions.Writer ? 'popupSettingsSpaceShareLinkDescriptionEditor' : 'popupSettingsSpaceShareLinkDescriptionViewer'));
		} else {
			parts.push(translate('popupSettingsSpaceShareLinkDescriptionApprove'));
		};

		parts.push(translate(invite.heldByOwner ? 'popupSettingsSpaceShareLinkDescriptionOwner' : 'popupSettingsSpaceShareLinkDescriptionShared'));

		return parts.join(' ');
	};

	useEffect(() => {
		init();
	}, [ spaceview.spaceAccessType ]);

	// The invite arrives from the middleware after the first render.
	useEffect(() => {
		syncSwitch();
	}, [ invite?.cid ]);

	return (
		<>
			<div>
				<UpsellBanner components={[ 'members', 'space' ]} route={analytics.route.settingsSpaceShare} />
			</div>

			<div id="titleWrapper" className="titleWrapper">
				{isSearching ? (
					<Filter
						ref={filterRef}
						iconParam={{ name: 'common/search' }}
						placeholder={translate('popupSettingsSpaceShareSearchPlaceholder')}
						focusOnMount={true}
						size={36}
						onChange={v => setSearch(v)}
						onClear={onSearch}
					/>
				) : (
					<>
						<Title text={translate('commonMembers')} />

						<div className="side right">
							<Icon name="common/search" className="search" withBackground={true} onClick={onSearch} />
							{canAddMembers ? <Button className="c28" color="accent" text={translate('popupSettingsSpaceShareAddMembers')} onClick={onAdd} /> : ''}
						</div>
					</>
				)}
			</div>

			{canManageInvite ? (
				<div id="sectionInvite" className="section sectionInvite">
					<div className="inviteToggle">
						<div className="info">
							<Title text={translate('popupSettingsSpaceShareInviteLinkTitle')} />
							<Label text={getLinkDescription()} />
						</div>

						<Switch ref={switchRef} className="big" value={!!invite?.cid} readonly={isLoading || !canToggleInvite} onChange={onLinkToggle} />
					</div>

					{isUnsafe ? (
						<div className="inviteWarning">
							<Icon name="popup/header/warning" className="warning" />
							<Label text={translate('inviteUnsafeText')} />
							<Button className="c28" color="blank" text={translate('popupInviteManageReset')} onClick={() => Action.inviteReset(space)} />
						</div>
					) : ''}

					{hasLink ? (
						<div className="inviteButtons">
							<Button className="c36" color="blank" iconParam={{ name: 'menu/action/copy' }} text={translate('popupSettingsSpaceShareCopyLink')} onClick={onCopy} />
							<Button className="c36" color="blank" iconParam={{ name: 'common/qr' }} text={translate('popupSettingsSpaceShareQRCode')} onClick={onQr} />
							<Button className="c36" color="blank" iconParam={{ name: 'menu/action/settings' }} text={translate('popupSettingsSpaceShareManageLink')} onClick={onManage} />
						</div>
					) : ''}
				</div>
			) : ''}

			<Members {...props} search={isSearching ? search : ''} />
			<Error text={error} />
		</>
	);

});

export default PageMainSettingsSpaceShare;
