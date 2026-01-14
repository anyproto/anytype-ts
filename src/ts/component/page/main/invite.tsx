import React, { forwardRef, useRef, useState, useImperativeHandle, useEffect } from 'react';
import { Loader, Title, Error, Frame, Button, Footer } from 'Component';
import { I, C, S, U, J, translate, keyboard, Action } from 'Lib';

const PageMainInvite = forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const { isPopup } = props;
	const nodeRef = useRef(null);
	const frameRef = useRef(null);
	const [ error, setError ] = useState('');

	const onError = (code: number, request: string) => {
		const errorCodes = Object.values(J.Error.Code[request]);

		let icon = '';
		let title = '';
		let text = '';

		if (errorCodes.includes(code)) {
			title = translate(`popupConfirm${request}Error${code}Title`);
			text = translate(`popupConfirm${request}Error${code}Text`);
		} else {
			title = translate('popupInviteRequestTitle');
			text = translate('popupConfirmInviteError');
		};

		if ((request == 'SpaceInviteView') && (code == J.Error.Code.SpaceInviteView.INVITE_NOT_FOUND)) {
			icon = 'noAccess';
		} else {
			icon = 'error';
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
	};

	const init = () => {
		const match = keyboard.getMatch(false);
		const { cid, key, route } = match.params;

		const request = (message: any) => {
			S.Popup.open('inviteRequest', { 
				data: { 
					invite: message, 
					cid, 
					key, 
					route,
				},
			});
		};

		if (!cid || !key) {
			setError(translate('pageMainInviteErrorData'));
			return;
		};

		const cb = (message: any) => {
			const spaceview = U.Space.getSpaceviewBySpaceId(message.spaceId);

			if (message.error.code) {
				onError(message.error.code, 'SpaceInviteView');
			} else 
			if (spaceview) {
				if (spaceview.isAccountJoining) {
					Action.inviteRequest();
				} else
				if (!spaceview.isAccountRemoving && !spaceview.isAccountDeleted) {
					U.Router.switchSpace(message.spaceId, '', false, {}, false);
				} else {
					request(message);
				};
			} else {
				request(message);
			};
		};

		C.SpaceInviteView(cid, key, (message: any) => {
			U.Space.openDashboardOrVoid({
				onFadeIn: () => {
					window.setTimeout(() => cb(message), J.Constant.delay.popup);
				},
			});
		});
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
	}, []);

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
							onClick={() => U.Space.openDashboardOrVoid()} 
						/>
					</div>
				) : <Loader />}
			</Frame>

			<Footer component="mainObject" {...props} />
		</div>
	);

});

export default PageMainInvite;
