import React, { forwardRef, useRef, useState, useImperativeHandle, useEffect } from 'react';
import { Loader, Title, Error, Frame, Button, Footer } from 'Component';
import { I, C, S, U, J, translate } from 'Lib';

interface PageMainInviteRefProps {
	resize: () => void;
};

const PageMainInvite = forwardRef<PageMainInviteRefProps, I.PageComponent>((props, ref) => {

	const { isPopup } = props;
	const nodeRef = useRef(null);
	const frameRef = useRef(null);
	const cid = useRef('');
	const key = useRef('');
	const [ error, setError ] = useState('');

	const init = () => {
		const data = U.Common.searchParam(U.Router.history.location.search);

		if ((cid.current == data.cid) && (key.current == data.key)) {
			return;
		};

		cid.current = data.cid;
		key.current = data.key;

		if (!data.cid || !data.key) {
			setError(translate('pageMainInviteErrorData'));
		} else {
			C.SpaceInviteView(data.cid, data.key, (message: any) => {
				U.Space.openDashboard({ replace: true });

				S.Popup.closeAll(null, () => {
					const space = U.Space.getSpaceviewBySpaceId(message.spaceId);

					if (message.error.code) {
						let icon = '';
						let title = '';
						let text = '';

						if (message.error.code == J.Error.Code.SPACE_IS_DELETED) {
							icon = 'error';
							title = translate('popupConfirmSpaceDeleted');
						} else {
							icon = 'sad';
							title = translate('popupInviteRequestTitle');
							text = translate('popupConfirmInviteError');
						};

						S.Popup.open('confirm', {
							data: {
								icon,
								bgColor: 'red',
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
										U.Router.switchSpace(message.spaceId, '', false, {});
									},
								},
							});
						} else {
							S.Popup.open('inviteRequest', { data: { invite: message, ...data } });
						};
					} else {
						S.Popup.open('inviteRequest', { data: { invite: message, ...data } });
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
