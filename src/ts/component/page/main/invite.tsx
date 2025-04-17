import React, { forwardRef, useRef, useState, useImperativeHandle, useEffect } from 'react';
import { Loader, Title, Error, Frame, Button, Footer } from 'Component';
import { I, C, S, U, J, translate } from 'Lib';

interface PageMainInviteRefProps {
	resize: () => void;
};

const PageMainInvite = forwardRef<PageMainInviteRefProps, I.PageComponent>((props, ref) => {

	const { isPopup, match, location } = props;
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
							icon = 'error';
							title = translate(`popupConfirmInviteError${code}Title`);
							text = translate(`popupConfirmInviteError${code}Text`);
						} else {
							icon = 'sad';
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
							S.Popup.open('inviteRequest', { 
								data: { 
									invite: message, 
									cid, 
									key, 
									route,
								},
							});
						};
					} else {
						S.Popup.open('inviteRequest', { 
							data: { 
								invite: message, 
								cid, 
								key, 
								route,
							},
						});
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
