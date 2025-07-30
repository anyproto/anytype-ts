import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { Title, Icon, Label, Button, Error } from 'Component';
import { I, C, S, U, translate, analytics } from 'Lib';
import { observer } from 'mobx-react';

const PopupInviteRequest = observer(forwardRef<{}, I.Popup>((props, ref) => {

	const { param, close } = props;
	const [error, setError] = useState('');
	const refButton = useRef(null);

	const onRequest = () => {
		const { account } = S.Auth;
		const { data } = param;
		const { invite, cid, key } = data;
		const space = U.Space.getSpaceview();

		if (!account || refButton.current?.isLoading()) {
			return;
		};

		refButton.current?.setLoading(true);

		C.SpaceJoin(account.info.networkId, invite.spaceId, cid, key, (message: any) => {
			refButton.current?.setLoading(false);

			if (message.error.code) {
				setError(message.error.description);
				return;
			};

			close(() => {
				U.Common.onInviteRequest();
				analytics.event('ScreenRequestSent');
			});
		});
	};

	useEffect(() => {
		const { data } = param;
		const { route } = data;
		const space = U.Space.getSpaceview();

		analytics.event('ScreenInviteRequest', { route });
	}, []);

	const { data } = param;
	const { invite } = data;
	const spaceName = U.Common.shorten(String(invite.spaceName || translate('defaultNamePage')), 32);
	const creatorName = U.Common.shorten(String(invite.creatorName || translate('defaultNamePage')), 32);

	return (
		<>
			<Title text={translate('popupInviteRequestTitle')} />
			
			<div className="iconWrapper">
				<Icon className="join" />
			</div>

			<Label className="invitation" text={U.Common.sprintf(translate('popupInviteRequestText'), spaceName, creatorName)} />

			<div className="buttons">
				<Button ref={refButton} onClick={onRequest} text={translate('popupInviteRequestRequestToJoin')} className="c36" />
			</div>

			<div className="note">{translate('popupInviteRequestNote')}</div>

			<Error text={error} />
		</>
	);

}));

export default PopupInviteRequest;
