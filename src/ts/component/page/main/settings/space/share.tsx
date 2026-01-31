import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Icon, Input, Button, Error, UpsellBanner } from 'Component';
import { I, C, S, U, translate, Preview, Action, analytics, keyboard } from 'Lib';
import Members from './share/members';

const PageMainSettingsSpaceShare = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const [ isLoading, setIsLoading ] = useState(false);
	const [ error, setError ] = useState('');
	const [ invite, setInvite ] = useState({ cid: '', key: '', type: I.InviteLinkType.None });
	const inputRef = useRef<any>(null);
	const hasLink = invite.cid && invite.key;
	const spaceview = U.Space.getSpaceview();
	const mySharedSpaces = U.Space.getMySharedSpacesList();
	const { sharedSpacesLimit } = U.Space.getProfile();
	const isWriterLimit = U.Space.getWriterLimit() <= 0;
	const limitReached = sharedSpacesLimit && (mySharedSpaces.length >= sharedSpacesLimit);
	const { isOnline } = S.Common;
	const isLocalNetwork = U.Data.isLocalNetwork();
	const canEdit = U.Space.isMyOwner() && (!limitReached || spaceview.isShared);

	const init = () => {
		if (spaceview.isShared && (!invite.cid || !invite.key)) {
			U.Space.getInvite(S.Common.space, (cid: string, key: string, inviteType: I.InviteType, permissions: I.ParticipantPermissions) => {
				if (cid && key) {
					setInviteData(cid, key, inviteType, permissions);
				};
			});
		} else {
			setInviteData('', '', I.InviteType.WithoutApprove, I.ParticipantPermissions.None);
		};
	};

	const setInviteData = (cid: string, key: string, inviteType: I.InviteType, permissions: I.ParticipantPermissions) => {
		let type = I.InviteLinkType.None;

		if (cid && key) {
			if (inviteType == I.InviteType.WithApprove) {
				type = I.InviteLinkType.Manual;
			} else {
				switch (permissions) {
					case I.ParticipantPermissions.Writer: {
						type = I.InviteLinkType.Editor;
						break;
					};

					case I.ParticipantPermissions.Reader: {
						type = I.InviteLinkType.Viewer;
						break;
					};
				};
			};
		};

		setInvite({ cid, key, type });
		inputRef.current?.setValue(U.Space.getInviteLink(cid, key));
	};

	const onInviteMenu = () => {
		if (!canEdit) {
			return;
		};

		const noApproveIds: I.InviteLinkType[] = [
			I.InviteLinkType.Editor,
			I.InviteLinkType.Viewer
		];
		const ids: I.InviteLinkType[] = noApproveIds.concat([ I.InviteLinkType.Manual ]);

		const options: any[] = ids.map((id: I.InviteLinkType) => getOptionById(id));

		if (isOnline && !isLocalNetwork) {
			if (options.length) {
				options.push({ isDiv: true });
			};
			options.push(getOptionById(I.InviteLinkType.None));
		};

		S.Menu.open('select', {
			element: '#linkTypeWrapper',
			className: 'inviteLinkType',
			classNameWrap: 'fromBlock',
			offsetX: 60,
			offsetY: -26,
			data: {
				options,
				noVirtualisation: true,
				onSelect: (e: any, item: any) => {
					const id = Number(item.id);

					if (id == invite.type) {
						return;
					};

					let created = false;
					let inviteType = I.InviteType.WithoutApprove;
					let permissions = I.ParticipantPermissions.Reader;

					if (id == I.InviteLinkType.None) {
						Action.inviteRevoke(S.Common.space, () => {
							setInviteData('', '', inviteType, permissions);
						});
						return;
					};

					setIsLoading(true);
					setError('');

					const callBack = () => {
						switch (id) {
							case I.InviteLinkType.Editor: {
								permissions = I.ParticipantPermissions.Writer;
								break;
							};

							case I.InviteLinkType.Manual: {
								inviteType = I.InviteType.WithApprove;
								break;
							};
						};

						const isChange = noApproveIds.includes(invite.type) && noApproveIds.includes(id);

						if (isChange) {
							C.SpaceInviteChange(S.Common.space, permissions, (message: any) => {
								setIsLoading(false);

								if (setErrorHandler(message.error)) {
									return;
								};

								setInviteData(invite.cid, invite.key, inviteType, permissions);
								Preview.toastShow({ text: U.String.sprintf(translate('toastInviteUpdate'), item.name) });
							});
						} else {
							C.SpaceInviteGenerate(S.Common.space, inviteType, permissions, (message: any) => {
								setIsLoading(false);

								if (setErrorHandler(message.error)) {
									return;
								};

								let toast = '';
								if (created) {
									toast = translate('toastInviteGenerate');
								} else {
									toast = U.String.sprintf(translate('toastInviteUpdate'), item.name);
								};

								setInviteData(message.inviteCid, message.inviteKey, inviteType, permissions);
								Preview.toastShow({ text: toast });

								if (!spaceview.isShared) {
									analytics.event('ShareSpace');
								};
							});
						};

						analytics.event('ClickShareSpaceNewLink', { type: id});
					};

					if (!spaceview.isShared) {
						created = true;

						C.SpaceMakeShareable(S.Common.space, (message: any) => {
							if (!setErrorHandler(message.error)) {
								callBack();
							};
						});
					} else {
						callBack();
					};
				},
			}
		});

		analytics.event('ScreenShareMenu');
	};

	const getOptionById = (id: I.InviteLinkType) => {
		const isDisabled = (id == I.InviteLinkType.Editor) && isWriterLimit;
		const suffix = I.InviteLinkType[id];

		return {
			id: String(id),
			icon: suffix.toLowerCase(),
			name: translate(`popupSettingsSpaceShareMenuInvite${suffix}Title`),
			description: translate(`popupSettingsSpaceShareMenuInvite${suffix}Description`),
			withDescription: true,
			disabled: isDisabled
		};
	};

	const onCopy = () => {
		if (invite.cid && invite.key) {
			U.Common.copyToast('', U.Space.getInviteLink(invite.cid, invite.key), translate('toastInviteCopy'));
			analytics.event('ClickShareSpaceCopyLink', { route: analytics.route.settingsSpaceShare });
		};
	};

	const setErrorHandler = (error: { description: string, code: number}) => {
		if (!error.code) {
			return false;
		};

		setError(error.description);
		return true;
	};

	const { name, description, icon } = getOptionById(invite.type);

	useEffect(() => {
		init();
	}, []);

	useEffect(() => {
		init();
	}, [ spaceview.spaceAccessType ]);

	return (
		<>
			<div>
				<UpsellBanner components={[ 'members', 'space' ]} route={analytics.route.settingsSpaceShare} />
			</div>

			<div id="titleWrapper" className="titleWrapper">
				<Title text={translate('popupSettingsSpaceShareTitle')} />
			</div>

			<div id="sectionInvite" className="section sectionInvite">
				<Title text={translate('popupSettingsSpaceShareInviteLinkTitle')} />

				<div id="linkTypeWrapper" className={[ 'linkTypeWrapper', canEdit ? 'canEdit' : '' ].join(' ')} onClick={onInviteMenu}>
					<Icon className={isLoading ? 'loading' : icon} />
					<div className="info">
						<Title text={name} />
						<Label text={description} />
					</div>
				</div>

				{hasLink ? (
					<div className="inviteLinkWrapper">
						<div className="inputWrapper">
							<Input 
								ref={inputRef} 
								readonly={true} 
								value={U.Space.getInviteLink(invite.cid, invite.key)} 
								onClick={() => inputRef.current?.select()} 
							/>
						</div>
						<Button onClick={onCopy} className="c36" color="black" text={translate('commonCopy')} />
					</div>
				) : ''}
			</div>

			<Members {...props} />
			<Error text={error} />
		</>
	);

}));

export default PageMainSettingsSpaceShare;
