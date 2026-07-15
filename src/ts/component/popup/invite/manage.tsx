import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { Title, Label, Icon, Input, Button, Switch, Error, Loader } from 'Component';
import * as I from 'Interface';

const PopupInviteManage = forwardRef<{}, I.Popup>((props, ref) => {

	const [ error, setError ] = useState('');
	const [ isLoading, setIsLoading ] = useState(false);
	const inputRef = useRef<any>(null);
	const approveRef = useRef<any>(null);
	const shareRef = useRef<any>(null);
	const { param, close } = props;
	const { data } = param;
	const { spaceId } = data;

	// Resetting the link revokes the invite before the replacement arrives, so this renders with no
	// invite in the store for a moment. Every hook has to run anyway — bail out below them, not here.
	const invite = S.Common.inviteGet(spaceId);
	const cid = invite?.cid || '';
	const key = invite?.key || '';
	const inviteType = invite?.inviteType;
	const permissions = invite?.permissions;
	const link = (cid && key) ? U.Space.getInviteLink(cid, key) : '';
	const isAutoApprove = inviteType == I.InviteType.WithoutApprove;
	const isShared = !!invite && !invite.heldByOwner;
	const isUnsafe = U.Space.isInviteUnsafe(spaceId);

	// An anyoneCanJoin invite above read access cannot be shared within the space: whoever holds
	// such a link is in, so it stays in the owner's account and is theirs alone to hand out.
	const canShare = !isAutoApprove || (permissions == I.ParticipantPermissions.Reader);

	// A Switch flips itself on click and only reads its prop on mount, so a refused request leaves it
	// showing a state the invite never reached. Put it back where the store says it should be.
	const syncSwitches = () => {
		const invite = S.Common.inviteGet(spaceId);

		approveRef.current?.setValue(invite?.inviteType == I.InviteType.WithoutApprove);
		shareRef.current?.setValue(!!invite && !invite.heldByOwner);
	};

	const setErrorHandler = (error: { code: number, description: string }) => {
		setIsLoading(false);

		if (!error.code) {
			return false;
		};

		syncSwitches();

		const { INVITE_ALREADY_SHARED, INVITE_NOT_SHAREABLE } = J.Error.Code.SpaceInviteGenerate;

		switch (error.code) {

			// The invite is already in the space's history: it cannot be taken back, only replaced.
			case INVITE_ALREADY_SHARED: {
				setError(translate('errorSpaceInviteGenerate106'));
				break;
			};

			// The invite grants more than read access to anyone holding it, so it stays with the owner.
			case INVITE_NOT_SHAREABLE: {
				setError(translate('errorSpaceInviteGenerate107'));
				break;
			};

			default: {
				setError(error.description);
				break;
			};
		};

		return true;
	};

	/**
	 * Regenerates the invite. With the same inviteType and shareWithinSpace this republishes the
	 * very same invite: same cid, same key, and the link already handed out keeps working.
	 */
	const generate = (inviteType: I.InviteType, permissions: I.ParticipantPermissions, shareWithinSpace: boolean, onDone?: () => void) => {
		setIsLoading(true);
		setError('');

		C.SpaceInviteGenerate(spaceId, inviteType, permissions, shareWithinSpace, (message: any) => {
			if (setErrorHandler(message.error)) {
				return;
			};

			S.Common.inviteSet(spaceId, {
				cid: message.inviteCid,
				key: message.inviteKey,
				inviteType: message.inviteType,
				permissions: message.permissions,
				heldByOwner: !shareWithinSpace,
			});

			onDone?.();
		});
	};

	const onAutoApprove = (e: any, v: boolean) => {
		const type = v ? I.InviteType.WithoutApprove : I.InviteType.WithApprove;

		// An anyoneCanJoin invite grants view access unless the owner raises it afterwards.
		generate(type, v ? I.ParticipantPermissions.Reader : permissions, isShared, () => {
			analytics.event('ClickShareSpaceNewLink', { type: U.Space.getInviteLinkType(type, I.ParticipantPermissions.Reader) });
		});
	};

	const onPermissions = () => {
		const options = [
			{ id: String(I.ParticipantPermissions.Reader), name: translate('participantPermissions0') },
			{ id: String(I.ParticipantPermissions.Writer), name: translate('participantPermissions1'), disabled: isShared },
		];

		S.Menu.open('select', {
			element: '#invitePermissionsSelect',
			horizontal: I.MenuDirection.Right,
			data: {
				value: String(permissions),
				options,
				onSelect: (e: any, item: any) => {
					const v = Number(item.id);

					if (v == permissions) {
						return;
					};

					setIsLoading(true);
					setError('');

					C.SpaceInviteChange(spaceId, v, (message: any) => {
						if (setErrorHandler(message.error)) {
							return;
						};

						S.Common.inviteSet(spaceId, { ...invite, permissions: v });
						analytics.event('ClickShareSpaceNewLink', { type: U.Space.getInviteLinkType(inviteType, v) });
					});
				},
			},
		});
	};

	const onShareWithinSpace = (e: any, v: boolean) => {
		if (!v || !canShare) {
			syncSwitches();
			return;
		};

		S.Popup.open('confirm', {
			data: {
				iconParam: { name: 'popup/header/warning', color: 'grey' },
				title: translate('popupInviteManageShareConfirmTitle'),
				text: translate('popupInviteManageShareConfirmText'),
				textConfirm: translate('popupInviteManageShareConfirmButton'),
				onCancel: syncSwitches,
				onConfirm: () => generate(inviteType, permissions, true, () => analytics.event('ShareSpaceInviteWithinSpace')),
			},
		});
	};

	const onCopy = () => {
		U.Common.copyToast('', link, translate('toastInviteCopy'));
		analytics.event('ClickShareSpaceCopyLink', { route: analytics.route.settingsSpaceShare });
	};

	const onReset = () => {
		Action.inviteReset(spaceId);
	};

	let calloutText = '';
	if (isUnsafe) {
		calloutText = translate('inviteUnsafeText');
	} else
	if (isAutoApprove) {
		calloutText = translate('popupInviteManageAutoApproveWarning');
	};

	let shareHint = '';
	if (!canShare) {
		shareHint = translate('popupInviteManageShareDisabled');
	} else
	if (isShared) {
		shareHint = translate('popupInviteManageShareLocked');
	};

	useEffect(() => {
		inputRef.current?.setValue(link);
	}, [ link ]);

	useEffect(() => {
		analytics.event('ScreenInviteManage');
	}, []);

	if (!cid) {
		return <Loader id="loader" />;
	};

	return (
		<>
			{isLoading ? <Loader id="loader" /> : ''}

			<Title text={translate('popupInviteManageTitle')} />

			{calloutText ? (
				<div className={[ 'callout', isUnsafe ? 'isUnsafe' : '' ].join(' ')}>
					<Icon name="popup/header/warning" className="warning" />
					<Label text={calloutText} />
				</div>
			) : ''}

			<div className="items">
				<div className="item">
					<div className="info">
						<Label className="name" text={translate('popupInviteManageAutoApprove')} />
						<Label className="descr" text={translate('popupInviteManageAutoApproveDescription')} />
					</div>
					<Switch ref={approveRef} className="big" value={isAutoApprove} onChange={onAutoApprove} />
				</div>

				{isAutoApprove ? (
					<div className="item">
						<div className="info">
							<Label className="name" text={translate('popupInviteManagePermissions')} />
						</div>

						<div id="invitePermissionsSelect" className="value" onClick={onPermissions}>
							<div className="name">{translate(`participantPermissions${permissions}`)}</div>
							<Icon name="arrow/button" className="arrow" width={6} height={10} />
						</div>
					</div>
				) : ''}

				<div className="item">
					<div className="info">
						<Label className="name" text={translate('popupInviteManageShare')} />
						{shareHint ? <Label className="descr" text={shareHint} /> : ''}
					</div>
					<Switch ref={shareRef} className="big" value={isShared} readonly={isShared || !canShare} onChange={onShareWithinSpace} />
				</div>
			</div>

			<div className="inputWrapper">
				<Input ref={inputRef} readonly={true} value={link} onClick={() => inputRef.current?.select()} />
			</div>

			<div className="buttons">
				<Button onClick={onCopy} text={translate('popupInviteManageCopy')} className="c36" color="accent" />
				<Button onClick={onReset} text={translate('popupInviteManageReset')} className="c36" color="blank" />
			</div>

			<Error text={error} />
		</>
	);

});

export default PopupInviteManage;
