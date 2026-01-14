import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { Title, Label, Button, Error, IconObject } from 'Component';
import { I, C, S, U, translate, analytics, Preview , Action} from 'Lib';
import { observer } from 'mobx-react';

const PopupInviteRequest = observer(forwardRef<{}, I.Popup>((props, ref) => {

	const { param, close } = props;
	const { account } = S.Auth;
	const { data } = param;
	const { route, cid, key } = data;
	const [ error, setError ] = useState('');
	const invite = data.invite || {};
	const refButton = useRef(null);
	const spaceName = U.String.shorten(String(invite.spaceName || translate('defaultNamePage')), 32);
	const creatorName = U.String.shorten(String(invite.creatorName || translate('defaultNamePage')), 32);

	let title = '';
	let text = '';
	let button = '';

	switch (invite.inviteType) {
		case I.InviteType.WithApprove: {
			title = translate('popupInviteRequestAccessTitle');
			button = translate('popupInviteRequestRequestToJoin');

			switch (invite.uxType) {
				default: {
					text = translate('popupInviteRequestAccessTextData');
					break;
				};

				case I.SpaceUxType.Chat:
					text = translate('popupInviteRequestAccessTextChat');
					break;
			};
			break;
		};

		case I.InviteType.WithoutApprove:
			title = translate('popupInviteRequestInviteTitle');
			button = translate('commonJoin');

			switch (invite.uxType) {
				default: {
					text = translate('popupInviteRequestInviteTextData');
					break;
				};

				case I.SpaceUxType.Chat:
					text = translate('popupInviteRequestInviteTextChat');
					break;
			};
			break;
	};

	const onRequest = () => {
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

			if (invite.inviteType === I.InviteType.WithApprove) {
				close(() => Action.inviteRequest());
			};

			if (invite.inviteType === I.InviteType.WithoutApprove) {
				close(() => {
					Preview.toastShow({ text: U.String.sprintf(translate('toastJoinSpace'), spaceName) });
					analytics.event('ClickJoinSpaceWithoutApproval');
				});
			};
		});
	};

	useEffect(() => {
		analytics.event('ScreenInviteRequest', { route, type: invite.inviteType });
	}, []);

	return (
		<>
			<Label className="top" text={title} />
			
			<div className="iconWrapper">
				<IconObject 
					object={{ 
						layout: I.ObjectLayout.SpaceView, 
						name: spaceName, 
						iconImage: invite.iconImage,
						iconOption: invite.iconOption || 1,
						uxType: invite.uxType || I.SpaceUxType.Data,
					}}
					size={96} 
				/>
			</div>

			<Title text={spaceName} />
			<div className="label creator">
				{translate('popupInviteRequestCreatedBy')}
				<b>
					<IconObject 
						object={{ 
							layout: I.ObjectLayout.Participant, 
							iconImage: invite.creatorIcon, 
							name: creatorName,
						}}
					/>
					{creatorName}
				</b>
			</div>
			<Label className="text" text={text} />

			<div className="buttons">
				<Button ref={refButton} onClick={onRequest} text={button} color="accent" />
				<Button onClick={() => close()} text={translate('commonCancel')} color="blank" />
			</div>

			<Error text={error} />
		</>
	);

}));

export default PopupInviteRequest;
