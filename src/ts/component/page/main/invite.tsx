import React, { forwardRef, useRef, useState, useImperativeHandle, useEffect } from 'react';
import { Loader, Title, Error, Frame, Button, Footer } from 'Component';
import { I, C, S, U, J, translate, Preview, Onboarding } from 'Lib';

interface PageMainInviteRefProps {
	resize: () => void;
};

const PageMainInvite = forwardRef<PageMainInviteRefProps, I.PageComponent>((props, ref) => {

	const { isPopup, location } = props;
	const nodeRef = useRef(null);
	const frameRef = useRef(null);
	const cidRef = useRef('');
	const keyRef = useRef('');
	const [ error, setError ] = useState('');

	const init = () => {
		const { cid, key, route } = U.Common.searchParam(location.search);

		if ((cidRef.current == cid) && (keyRef.current == key)) {
			return;
		};

		cidRef.current = cid;
		keyRef.current = key;

		const request = (invite) => {
			S.Popup.open('inviteRequest', { 
				onClose: () => Onboarding.start('basics', isPopup),
				data: { 
					invite, 
					cid, 
					key, 
					route,
				},
			});
		};

		if (!cid || !key) {
			setError(translate('pageMainInviteErrorData'));
		} else {
			C.SpaceInviteView(cid, key, (message: any) => {
				U.Space.openDashboard({ replace: true });

				S.Popup.closeAll(null, () => {
					const space = U.Space.getSpaceviewBySpaceId(message.spaceId);

					if (message.error.code) {
						const errorCodes = Object.values(J.Error.Code.SpaceInviteView);
						const code = message.error.code;

						let icon = '';
						let title = '';
						let text = '';

						if (errorCodes.includes(code)) {
							icon = code == J.Error.Code.SpaceInviteView.INVITE_NOT_FOUND ? 'noaccess' : 'error';
							title = translate(`popupConfirmInviteError${code}Title`);
							text = translate(`popupConfirmInviteError${code}Text`);
						} else {
							icon = 'error';
							title = translate('popupInviteRequestTitle');
							text = translate('popupConfirmInviteError');
						};

						S.Popup.open('confirm', {
							data: {
								icon,
								title,
								text,
								textConfirm: translate('commonOkay'),
								canCancel: false,
							},
						});
					} else 
					if (space) {
						if (space.isAccountJoining) {
							U.Common.onInviteRequest();
						} else
						if (!space.isAccountRemoving && !space.isAccountDeleted) {
							S.Popup.open('confirm', {
								data: {
									title: translate('popupConfirmDuplicateSpace'),
									textConfirm: translate('commonOpenSpace'),
									textCancel: translate('commonCancel'),
									onConfirm: () => {
										U.Router.switchSpace(message.spaceId, '', false, {}, false);
									},
								},
							});
						} else {
							request(message);
						};
					} else {
						if (message.inviteType == I.InviteType.WithoutApprove) {
							const { account } = S.Auth;
							const spaceName = message.spaceName || translate('defaultNamePage');
							const creatorName = message.creatorName || translate('defaultNamePage');

							S.Popup.open('confirm', {
								onClose: () => Onboarding.start('basics', isPopup),
								data: {
									icon: 'join',
									title: U.Common.sprintf(translate('popupConfirmJoinSpaceTitle'), spaceName),
									text: U.Common.sprintf(translate('popupConfirmJoinSpaceText'), spaceName, creatorName),
									textConfirm: translate('popupConfirmJoinSpaceButtonConfirm'),
									onConfirm: () => {
										C.SpaceJoin(account.info.networkId, message.spaceId, cid, key, () => {
											if (message.error.code) {
												setError(message.error.description);
											} else {
												Preview.toastShow({ text: U.Common.sprintf(translate('toastJoinSpace'), spaceName) });
											};
										});
									},
								},
							});
						} else {
							request(message);
						};
					};
				});
			});
		};
	};

	const resize = () => {
		const win = $(window);
		const obj = U.Common.getPageFlexContainer(isPopup);
		const node = $(nodeRef.current);
		const oh = obj.height();
		const wh = isPopup ? oh : win.height();

		node.css({ height: wh });
		frameRef.current?.resize();
	};

	useEffect(() => {
		init();
		resize();
	});

	useImperativeHandle(ref, () => ({ resize }));

	return (
		<div 
			ref={nodeRef}
			className="wrapper"
		>
			<Frame ref={frameRef}>
				<Title text={error ? translate('commonError') : translate('pageMainInviteTitle')} />
				<Error text={error} />

				{error ? (
					<div className="buttons">
						<Button 
							text={translate('commonBack')} 
							color="blank" 
							className="c36" 
							onClick={() => U.Space.openDashboard()} 
						/>
					</div>
				) : <Loader />}
			</Frame>

			<Footer component="mainObject" {...props} />
		</div>
	);

});

export default PageMainInvite;
